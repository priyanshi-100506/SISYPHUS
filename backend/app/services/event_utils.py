import json
import hashlib
from typing import Any, Optional

def canonical_hash(obj: Any) -> Optional[str]:
    if obj is None:
        return None
    serialized = json.dumps(obj, sort_keys=True, ensure_ascii=False, separators=(",", ":"))
    return hashlib.sha256(serialized.encode("utf-8")).hexdigest()

def truncate_preview(obj: Any, max_bytes: int = 2048) -> Optional[str]:
    if obj is None:
        return None
    s = json.dumps(obj, ensure_ascii=False)
    encoded = s.encode("utf-8")
    if len(encoded) <= max_bytes:
        return s
    return encoded[:max_bytes].decode("utf-8", errors="replace")
