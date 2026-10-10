from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.users import User, RoleEnum
from app.schemas.users import UserCreate, UserLogin, UserOut, TokenResponse
from app.security import create_access_token, get_current_user, hash_password, require_roles, verify_password

router = APIRouter(prefix="/api/auth", tags=["auth"])

@router.post("/login", response_model=TokenResponse)
def login(creds: UserLogin, db: Session = Depends(get_db)):
    u = db.query(User).filter(User.username == creds.username).first()
    if not u or not verify_password(creds.password, u.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid username or password")
    if not u.is_active:
        raise HTTPException(status_code=403, detail="User account is deactivated")
    
    token = create_access_token(u)
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserOut.model_validate(u)
    )

@router.post("/register", response_model=UserOut)
def register_user(payload: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter((User.username == payload.username) | (User.email == payload.email)).first()
    if existing:
        raise HTTPException(status_code=409, detail="Username or email already exists")

    user = User(
        username=payload.username,
        email=payload.email,
        full_name=payload.full_name,
        role=payload.role,
        designation=payload.designation,
        department=payload.department,
        jurisdiction_id=payload.jurisdiction_id,
        hashed_password=hash_password(payload.password),
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return UserOut.model_validate(user)

@router.get("/users", response_model=list[UserOut])
def list_users(
    role: str = None,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(RoleEnum.ADMIN))
):
    q = db.query(User)
    if role:
        q = q.filter(User.role == role)
    return [UserOut.model_validate(u) for u in q.all()]

@router.get("/me", response_model=UserOut)
def me(current_user: User = Depends(get_current_user)):
    return UserOut.model_validate(current_user)
