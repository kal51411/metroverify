from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from app.database import get_db
from app.models.users import User, RoleEnum
from app.schemas.users import UserOut
from app.services.v3_auth_service import hash_password, verify_password, create_access_token, verify_access_token

router = APIRouter(prefix="/api/v3/auth", tags=["v3-auth"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v3/auth/login", auto_error=False)

def get_current_user(token: Optional[str] = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    if not token:
        # Fallback for development if no token provided: default to first user
        fallback = db.query(User).first()
        if fallback:
            return fallback
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials were not provided."
        )

    payload = verify_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token."
        )

    username = payload.get("sub")
    if not username:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token payload missing subject."
        )

    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User associated with token not found."
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is deactivated."
        )
    return user

def require_role(allowed_roles: List[RoleEnum]):
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        user_role = current_user.role
        if isinstance(user_role, str):
            try:
                user_role = RoleEnum(user_role)
            except ValueError:
                pass
        
        # Admin has superuser access
        if user_role == RoleEnum.ADMIN or current_user.role == "ADMIN":
            return current_user

        if user_role not in allowed_roles and current_user.role not in [r.value for r in allowed_roles]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied: Requires role in {[r.value for r in allowed_roles]}"
            )
        return current_user
    return role_checker

class V3RegisterRequest(BaseModel):
    username: str
    email: EmailStr
    full_name: str
    password: str
    role: RoleEnum = RoleEnum.APPLICANT
    designation: Optional[str] = None
    department: Optional[str] = None

class V3LoginRequest(BaseModel):
    username: str
    password: str

class V3TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut

@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register_v3_user(payload: V3RegisterRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter((User.username == payload.username) | (User.email == payload.email)).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username or email already registered.")
    
    user = User(
        username=payload.username,
        email=payload.email,
        full_name=payload.full_name,
        hashed_password=hash_password(payload.password),
        role=payload.role,
        designation=payload.designation,
        department=payload.department,
        is_active=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return UserOut.model_validate(user)

@router.post("/login", response_model=V3TokenResponse)
def login_v3_user(payload: V3LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == payload.username).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid username or password.")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User account is deactivated.")

    token = create_access_token({"sub": user.username, "id": user.id, "role": user.role.value if hasattr(user.role, 'value') else str(user.role)})
    return V3TokenResponse(access_token=token, user=UserOut.model_validate(user))

@router.get("/me", response_model=UserOut)
def get_v3_me(current_user: User = Depends(get_current_user)):
    return UserOut.model_validate(current_user)
