import hashlib

def hash_token(token: str) -> str:
    return hashlib.sha512(token.encode()).hexdigest()
