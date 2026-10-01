import pytest
from app.analysis.detectors import (
    EventDTO,
    detect_repeated_tool,
    detect_state_loop,
    detect_retry_storm,
    detect_execution_bloat,
    detect_tool_oscillation,
    detect_all,
)

def test_detect_repeated_tool():
    # Clean case
    events = [
        EventDTO(sequence_number=1, event_type="tool", tool_name="search", input_hash="hash1"),
        EventDTO(sequence_number=2, event_type="tool", tool_name="search", input_hash="hash2"),
    ]
    assert len(detect_repeated_tool(events)) == 0

    # Trigger case (3 repeated calls)
    events_repeated = [
        EventDTO(sequence_number=1, event_type="tool", tool_name="search", input_hash="hash1", tokens_in=100, tokens_out=50),
        EventDTO(sequence_number=2, event_type="tool", tool_name="search", input_hash="hash1", tokens_in=100, tokens_out=50),
        EventDTO(sequence_number=3, event_type="tool", tool_name="search", input_hash="hash1", tokens_in=100, tokens_out=50),
    ]
    findings = detect_repeated_tool(events_repeated)
    assert len(findings) == 1
    assert findings[0].type == "REPEATED_TOOL"
    assert findings[0].severity == "low"
    assert findings[0].evidence["count"] == 3
    assert findings[0].waste_tokens == 300  # 2 redundant calls * 150 tokens


def test_detect_state_loop():
    # State loop: S1 -> S2 -> S1 -> S2
    events = [
        EventDTO(sequence_number=1, event_type="tool", state_hash="S1", tokens_in=50),
        EventDTO(sequence_number=2, event_type="tool", state_hash="S2", tokens_in=50),
        EventDTO(sequence_number=3, event_type="tool", state_hash="S1", tokens_in=50),
        EventDTO(sequence_number=4, event_type="tool", state_hash="S2", tokens_in=50),
    ]
    findings = detect_state_loop(events)
    assert len(findings) == 1
    assert findings[0].type == "STATE_LOOP"
    assert findings[0].evidence["cycle_length"] == 2
    assert findings[0].evidence["repeats"] == 2


def test_detect_retry_storm():
    # 3 consecutive failures for same tool call
    events = [
        EventDTO(sequence_number=1, event_type="tool", tool_name="api", input_hash="q1", status="error"),
        EventDTO(sequence_number=2, event_type="tool", tool_name="api", input_hash="q1", status="error"),
        EventDTO(sequence_number=3, event_type="tool", tool_name="api", input_hash="q1", status="error"),
    ]
    findings = detect_retry_storm(events)
    assert len(findings) == 1
    assert findings[0].type == "RETRY_STORM"
    assert findings[0].severity == "high"


def test_detect_execution_bloat():
    events = [EventDTO(sequence_number=i, event_type="tool") for i in range(1, 25)]
    findings = detect_execution_bloat(events, baseline_median=5)
    assert len(findings) == 1
    assert findings[0].type == "EXECUTION_BLOAT"
    assert findings[0].evidence["total_steps"] == 24


def test_detect_tool_oscillation():
    # A -> B -> A -> B
    events = [
        EventDTO(sequence_number=1, event_type="tool", tool_name="search"),
        EventDTO(sequence_number=2, event_type="tool", tool_name="browser"),
        EventDTO(sequence_number=3, event_type="tool", tool_name="search"),
        EventDTO(sequence_number=4, event_type="tool", tool_name="browser"),
    ]
    findings = detect_tool_oscillation(events)
    assert len(findings) == 1
    assert findings[0].type == "TOOL_OSCILLATION"
    assert findings[0].evidence["alternations"] == 4
