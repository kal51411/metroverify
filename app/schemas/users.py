from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from app.models.users import RoleEnum

class UserBase(BaseModel):
    username: str
    email: EmailStr
    full_name: str
    role: RoleEnum
    designation: Optional[str] = None
    department: Optional[str] = None
    jurisdiction_id: Optional[int] = None

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class UserOut(UserBase):
    id: int
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserOut
