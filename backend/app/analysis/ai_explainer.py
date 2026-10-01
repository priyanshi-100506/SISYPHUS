import logging
from typing import Dict, Any
from app.core.config import settings

logger = logging.getLogger(__name__)

async def generate_explanation(finding_type: str, evidence: Dict[str, Any]) -> str:
    """
    Phase 5: Generates a 1-3 sentence plain-English explanation for a finding using evidence.
    Falls back gracefully to template-based explainers if ANTHROPIC_API_KEY is not set.
    """
    if settings.ANTHROPIC_API_KEY:
        try:
            import anthropic
            client = anthropic.AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)
            prompt = (
                f"You are an AI reliability engineer analyzing an execution trace finding.\n"
                f"Finding Type: {finding_type}\n"
                f"Evidence: {evidence}\n\n"
                f"Provide a concise 1-2 sentence plain English explanation of why this happened and what waste it caused."
            )
            response = await client.messages.create(
                model="claude-3-5-sonnet-20241022",
                max_tokens=150,
                messages=[{"role": "user", "content": prompt}]
            )
            return response.content[0].text.strip()
        except Exception as e:
            logger.warning(f"Anthropic API call failed: {e}. Falling back to deterministic explanation template.")

    # Fallback explanation templates
    if finding_type == "REPEATED_TOOL":
        count = evidence.get("count", 3)
        tool = evidence.get("tool_name", "tool")
        return f"The agent invoked '{tool}' {count} times with identical inputs without taking new action between calls, indicating a redundant tool execution loop."
    elif finding_type == "STATE_LOOP":
        repeats = evidence.get("repeats", 2)
        cycle = evidence.get("cycle_length", 2)
        return f"The agent entered a cyclical state loop of length {cycle} that repeated {repeats} times, producing no new state progress."
    elif finding_type == "RETRY_STORM":
        count = evidence.get("consecutive_failures", 3)
        tool = evidence.get("tool_name", "tool")
        return f"The agent encountered {count} consecutive failures while retrying '{tool}' with identical arguments without error handling or fallback logic."
    elif finding_type == "EXECUTION_BLOAT":
        total = evidence.get("total_steps", 0)
        limit = evidence.get("baseline_limit", 20)
        return f"The run required {total} steps, exceeding the project median baseline limit of {limit} steps due to unoptimized reasoning paths."
    elif finding_type == "TOOL_OSCILLATION":
        tool_a = evidence.get("tool_a", "A")
        tool_b = evidence.get("tool_b", "B")
        alts = evidence.get("alternations", 4)
        return f"The agent oscillated between tools '{tool_a}' and '{tool_b}' {alts} times without converging on a decision."
    
    return "Redundant execution pattern detected based on rule-based analysis of events."
