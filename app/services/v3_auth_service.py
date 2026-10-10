from passlib.hash import sha256_crypt
import jwt
from datetime import datetime, timezone, timedelta
from typing import Optional
from app.config import settings

import hashlib

def hash_password(password: str) -> str:
    return sha256_crypt.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        if sha256_crypt.verify(plain_password, hashed_password):
            return True
    except Exception:
        pass
    if hashlib.sha256(plain_password.encode("utf-8")).hexdigest() == hashed_password:
        return True
    return False

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def verify_access_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except jwt.PyJWTError:
        return None
