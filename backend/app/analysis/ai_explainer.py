import logging
from typing import Dict, Any
from app.core.config import settings

logger = logging.getLogger(__name__)

def _safe_extract_text(response) -> str | None:
    """
    Safely extract text from a Gemini GenerateContentResponse.
    Returns None if the response is empty, blocked, or has no usable parts.
    """
    try:
        candidates = getattr(response, "candidates", None)
        if not candidates:
            logger.warning("Gemini returned no candidates.")
            return None

        candidate = candidates[0]

        # Check finish_reason — STOP(1) is the only fully-successful outcome
        finish_reason = getattr(candidate, "finish_reason", None)
        # finish_reason == 1 means STOP (normal completion)
        if finish_reason is not None and finish_reason != 1:
            logger.warning(f"Gemini candidate finish_reason={finish_reason} (not STOP). Skipping.")
            return None

        content = getattr(candidate, "content", None)
        if content is None:
            return None

        parts = getattr(content, "parts", None)
        if not parts:
            return None

        text_parts = [p.text for p in parts if hasattr(p, "text") and p.text]
        if not text_parts:
            return None

        return "".join(text_parts).strip() or None
    except Exception as exc:
        logger.warning(f"Failed to extract text from Gemini response: {exc}")
        return None


async def generate_explanation(finding_type: str, evidence: Dict[str, Any]) -> str:
    """
    Generates a 1-2 sentence plain-English explanation for a finding using evidence.
    Uses Gemini API if GEMINI_API_KEY is set, otherwise falls back to template-based explanations.
    """
    if settings.GEMINI_API_KEY:
        try:
            import google.generativeai as genai
            genai.configure(api_key=settings.GEMINI_API_KEY)
            model = genai.GenerativeModel("gemini-2.5-flash")
            prompt = (
                f"You are an AI reliability engineer analyzing an agent execution trace finding.\n"
                f"Finding Type: {finding_type}\n"
                f"Evidence: {evidence}\n\n"
                f"Provide a concise 1-2 sentence plain English explanation of why this happened "
                f"and what waste it caused. Be specific about the tool names and counts from the evidence. "
                f"Do not use markdown, bullet points, or headers — plain prose only."
            )
            response = model.generate_content(
                prompt,
                generation_config={"max_output_tokens": 200, "temperature": 0.3},
            )
            text = _safe_extract_text(response)
            if text:
                return text
            logger.warning("Gemini returned an empty/blocked response. Falling back to template.")
        except Exception as e:
            logger.warning(f"Gemini API call failed: {e}. Falling back to deterministic explanation template.")

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
