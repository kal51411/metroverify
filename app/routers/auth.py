import hashlib
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.users import User, RoleEnum
from app.schemas.users import UserCreate, UserLogin, UserOut, TokenResponse

router = APIRouter(prefix="/api/auth", tags=["auth"])

def hash_pw(pw: str) -> str:
    return hashlib.sha256(pw.encode("utf-8")).hexdigest()

@router.post("/login", response_model=TokenResponse)
def login(creds: UserLogin, db: Session = Depends(get_db)):
    u = db.query(User).filter(User.username == creds.username).first()
    if not u or u.hashed_password != hash_pw(creds.password):
        raise HTTPException(status_code=401, detail="Invalid username or password")
    if not u.is_active:
        raise HTTPException(status_code=403, detail="User account is deactivated")
    
    token = f"tok_{u.username}_{u.id}"
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserOut.model_validate(u)
    )

@router.get("/users", response_model=list[UserOut])
def list_users(role: str = None, db: Session = Depends(get_db)):
    q = db.query(User)
    if role:
        q = q.filter(User.role == role)
    return [UserOut.model_validate(u) for u in q.all()]

@router.get("/me", response_model=UserOut)
def get_current_user(user_id: int = 1, db: Session = Depends(get_db)):
    u = db.query(User).filter(User.id == user_id).first()
    if not u:
        u = db.query(User).first()
    return UserOut.model_validate(u)
