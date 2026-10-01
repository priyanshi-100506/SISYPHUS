import secrets
import hashlib
from typing import Tuple

def generate_api_key() -> Tuple[str, str, str]:
    """
    Generates a high-entropy API key.
    Returns: (full_key, key_hash, key_prefix)
    - full_key: 'sk_live_...' (shown once to user, never stored)
    - key_hash: SHA-256 hex digest of full_key (stored in database)
    - key_prefix: First 12 characters of full_key (stored for display)
    """
    raw_token = secrets.token_urlsafe(32)
    full_key = f"sk_live_{raw_token}"
    key_hash = hash_api_key(full_key)
    key_prefix = full_key[:12]
    return full_key, key_hash, key_prefix

def hash_api_key(key: str) -> str:
    """Computes SHA-256 hash of API key."""
    return hashlib.sha256(key.encode("utf-8")).hexdigest()
