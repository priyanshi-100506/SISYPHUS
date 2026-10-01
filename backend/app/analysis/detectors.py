from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional
from decimal import Decimal

# Default pricing fallback per million tokens (USD)
DEFAULT_PRICING: Dict[str, Dict[str, float]] = {
    "claude-3-5-sonnet": {"input": 3.00, "output": 15.00},
    "claude-sonnet-4-6": {"input": 3.00, "output": 15.00},
    "gpt-4o": {"input": 2.50, "output": 10.00},
    "gpt-4o-mini": {"input": 0.15, "output": 0.60},
    "default": {"input": 3.00, "output": 15.00},
}

@dataclass
class EventDTO:
    sequence_number: int
    event_type: str
    tool_name: Optional[str] = None
    model: Optional[str] = None
    input_hash: Optional[str] = None
    output_hash: Optional[str] = None
    state_hash: Optional[str] = None
    status: str = "ok"
    tokens_in: int = 0
    tokens_out: int = 0
    latency_ms: Optional[int] = 0

    @property
    def state(self) -> str:
        if self.state_hash:
            return self.state_hash
        return f"{self.tool_name or ''}:{self.input_hash or ''}:{self.output_hash or ''}"

@dataclass
class FindingDTO:
    type: str
    severity: str
    step_start: int
    step_end: int
    description: str
    evidence: Dict[str, Any]
    waste_tokens: int = 0
    waste_ms: int = 0
    waste_cost: float = 0.0

def calculate_waste(
    events: List[EventDTO],
    redundant_seqs: List[int],
    pricing_map: Optional[Dict[str, Dict[str, float]]] = None
) -> tuple[int, int, float]:
    """
    Given a list of redundant event sequence numbers, sum their tokens, latency, and cost.
    """
    pricing = pricing_map or DEFAULT_PRICING
    waste_tokens = 0
    waste_ms = 0
    waste_cost = 0.0

    events_by_seq = {e.sequence_number: e for e in events}
    for seq in redundant_seqs:
        ev = events_by_seq.get(seq)
        if not ev:
            continue
        tokens = ev.tokens_in + ev.tokens_out
        waste_tokens += tokens
        if ev.latency_ms:
            waste_ms += ev.latency_ms

        model = (ev.model or "").lower()
        rates = pricing.get(model, pricing.get("default", {"input": 3.00, "output": 15.00}))
        cost = (ev.tokens_in / 1_000_000.0 * rates["input"]) + (ev.tokens_out / 1_000_000.0 * rates["output"])
        waste_cost += cost

    return waste_tokens, waste_ms, round(waste_cost, 6)


# Detector 1: REPEATED_TOOL
def detect_repeated_tool(events: List[EventDTO], threshold: int = 3) -> List[FindingDTO]:
    findings: List[FindingDTO] = []
    # Group events by (tool_name, input_hash)
    groups: Dict[tuple, List[EventDTO]] = {}
    for ev in events:
        if ev.event_type == "tool" and ev.tool_name and ev.input_hash:
            key = (ev.tool_name, ev.input_hash)
            groups.setdefault(key, []).append(ev)

    for (tool_name, inp_hash), ev_list in groups.items():
        count = len(ev_list)
        if count >= threshold:
            if count == 3:
                severity = "low"
            elif count in (4, 5):
                severity = "medium"
            else:
                severity = "high"

            start_step = ev_list[0].sequence_number
            end_step = ev_list[-1].sequence_number
            seqs = [e.sequence_number for e in ev_list]
            redundant_seqs = seqs[1:]  # all except first call are considered waste

            waste_tokens, waste_ms, waste_cost = calculate_waste(events, redundant_seqs)

            findings.append(FindingDTO(
                type="REPEATED_TOOL",
                severity=severity,
                step_start=start_step,
                step_end=end_step,
                description=f"Tool '{tool_name}' called {count} times with identical inputs.",
                evidence={
                    "tool_name": tool_name,
                    "input_hash": inp_hash,
                    "count": count,
                    "steps": seqs
                },
                waste_tokens=waste_tokens,
                waste_ms=waste_ms,
                waste_cost=waste_cost
            ))
    return findings


# Detector 2: STATE_LOOP
def detect_state_loop(events: List[EventDTO], min_repeats: int = 2) -> List[FindingDTO]:
    """
    Detects when a sequence of states repeats. E.g. [S1, S2, S1, S2].
    """
    findings: List[FindingDTO] = []
    state_events = [e for e in events if e.state and e.state != "::"]
    if len(state_events) < 4:
        return findings

    states = [e.state for e in state_events]
    n = len(states)

    # Search for repeating cycle length L >= 2
    for L in range(2, n // 2 + 1):
        i = 0
        while i <= n - 2 * L:
            pattern = states[i:i + L]
            repeats = 1
            while i + (repeats + 1) * L <= n and states[i + repeats * L : i + (repeats + 1) * L] == pattern:
                repeats += 1

            if repeats >= min_repeats:
                loop_events = state_events[i : i + repeats * L]
                start_step = loop_events[0].sequence_number
                end_step = loop_events[-1].sequence_number
                seqs = [e.sequence_number for e in loop_events]
                # Waste = all iterations after the first loop iteration
                redundant_seqs = [e.sequence_number for e in loop_events[L:]]

                waste_tokens, waste_ms, waste_cost = calculate_waste(events, redundant_seqs)
                severity = "high" if repeats > 2 else "medium"

                findings.append(FindingDTO(
                    type="STATE_LOOP",
                    severity=severity,
                    step_start=start_step,
                    step_end=end_step,
                    description=f"State loop of length {L} repeated {repeats} times.",
                    evidence={
                        "cycle_length": L,
                        "repeats": repeats,
                        "steps": seqs
                    },
                    waste_tokens=waste_tokens,
                    waste_ms=waste_ms,
                    waste_cost=waste_cost
                ))
                i += repeats * L
            else:
                i += 1
    return findings


# Detector 3: RETRY_STORM
def detect_retry_storm(events: List[EventDTO], threshold: int = 3) -> List[FindingDTO]:
    findings: List[FindingDTO] = []
    current_storm: List[EventDTO] = []

    def commit_storm(storm: List[EventDTO]):
        if len(storm) >= threshold:
            count = len(storm)
            tool_name = storm[0].tool_name
            inp_hash = storm[0].input_hash
            start_step = storm[0].sequence_number
            end_step = storm[-1].sequence_number
            seqs = [e.sequence_number for e in storm]
            redundant_seqs = seqs[1:]

            waste_tokens, waste_ms, waste_cost = calculate_waste(events, redundant_seqs)

            # High severity if it never succeeded later in run, medium otherwise
            subsequent_success = any(
                e.event_type == "tool" and e.tool_name == tool_name and e.input_hash == inp_hash and e.status == "ok"
                for e in events if e.sequence_number > end_step
            )
            severity = "medium" if subsequent_success else "high"

            findings.append(FindingDTO(
                type="RETRY_STORM",
                severity=severity,
                step_start=start_step,
                step_end=end_step,
                description=f"Tool '{tool_name}' failed {count} times consecutively with identical inputs.",
                evidence={
                    "tool_name": tool_name,
                    "input_hash": inp_hash,
                    "consecutive_failures": count,
                    "steps": seqs
                },
                waste_tokens=waste_tokens,
                waste_ms=waste_ms,
                waste_cost=waste_cost
            ))

    for ev in events:
        if ev.event_type == "tool" and ev.status == "error":
            if not current_storm:
                current_storm.append(ev)
            else:
                prev = current_storm[-1]
                if ev.tool_name == prev.tool_name and ev.input_hash == prev.input_hash:
                    current_storm.append(ev)
                else:
                    commit_storm(current_storm)
                    current_storm = [ev]
        else:
            if current_storm:
                commit_storm(current_storm)
                current_storm = []

    if current_storm:
        commit_storm(current_storm)

    return findings


# Detector 4: EXECUTION_BLOAT
def detect_execution_bloat(events: List[EventDTO], baseline_median: int = 6) -> List[FindingDTO]:
    findings: List[FindingDTO] = []
    total_steps = len(events)
    limit = max(20, baseline_median * 3)

    if total_steps > limit:
        severity = "medium" if total_steps <= limit * 2 else "high"
        # Excess steps beyond baseline threshold are counted as waste
        excess_events = events[limit:]
        redundant_seqs = [e.sequence_number for e in excess_events]
        waste_tokens, waste_ms, waste_cost = calculate_waste(events, redundant_seqs)

        findings.append(FindingDTO(
            type="EXECUTION_BLOAT",
            severity=severity,
            step_start=events[0].sequence_number if events else 1,
            step_end=events[-1].sequence_number if events else total_steps,
            description=f"Run step count ({total_steps}) exceeded baseline limit ({limit}).",
            evidence={
                "total_steps": total_steps,
                "baseline_limit": limit
            },
            waste_tokens=waste_tokens,
            waste_ms=waste_ms,
            waste_cost=waste_cost
        ))
    return findings


# Detector 5: TOOL_OSCILLATION
def detect_tool_oscillation(events: List[EventDTO], min_alternations: int = 4) -> List[FindingDTO]:
    findings: List[FindingDTO] = []
    tool_events = [e for e in events if e.event_type == "tool" and e.tool_name]
    if len(tool_events) < min_alternations:
        return findings

    tools = [e.tool_name for e in tool_events]
    n = len(tools)

    i = 0
    while i <= n - min_alternations:
        tool_a = tools[i]
        tool_b = tools[i + 1]
        if tool_a == tool_b:
            i += 1
            continue

        count = 0
        curr = i
        while curr < n:
            expected = tool_a if (curr - i) % 2 == 0 else tool_b
            if tools[curr] == expected:
                count += 1
                curr += 1
            else:
                break

        if count >= min_alternations:
            osc_events = tool_events[i : i + count]
            start_step = osc_events[0].sequence_number
            end_step = osc_events[-1].sequence_number
            seqs = [e.sequence_number for e in osc_events]
            # Redundant steps are alternations past the first pair
            redundant_seqs = [e.sequence_number for e in osc_events[2:]]

            waste_tokens, waste_ms, waste_cost = calculate_waste(events, redundant_seqs)

            findings.append(FindingDTO(
                type="TOOL_OSCILLATION",
                severity="medium" if count < 6 else "high",
                step_start=start_step,
                step_end=end_step,
                description=f"Oscillating between tools '{tool_a}' and '{tool_b}' ({count} alternations).",
                evidence={
                    "tool_a": tool_a,
                    "tool_b": tool_b,
                    "alternations": count,
                    "steps": seqs
                },
                waste_tokens=waste_tokens,
                waste_ms=waste_ms,
                waste_cost=waste_cost
            ))
            i += count
        else:
            i += 1

    return findings


def detect_all(events: List[EventDTO], baseline_median: int = 6) -> List[FindingDTO]:
    all_findings: List[FindingDTO] = []
    all_findings.extend(detect_repeated_tool(events))
    all_findings.extend(detect_state_loop(events))
    all_findings.extend(detect_retry_storm(events))
    all_findings.extend(detect_execution_bloat(events, baseline_median=baseline_median))
    all_findings.extend(detect_tool_oscillation(events))
    return all_findings
