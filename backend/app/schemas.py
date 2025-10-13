from pydantic import BaseModel, Field
from uuid import UUID
from typing import Optional
from datetime import date, datetime

class StudentCreate(BaseModel):
    name: str
    age: Optional[int]
    father_name: Optional[str]
    gender: Optional[str]
    country: Optional[str]
    cnic_number: str
    date_of_birth: Optional[date]
    date_of_issue: Optional[date]
    date_of_expiry: Optional[date]
    address: Optional[str]
    # fingerprint_template will be populated server-side after capture

class StudentDB(BaseModel):
    id: UUID
    name: str
    cnic_number: str
    created_at: datetime

    class Config:
        orm_mode = True

class AuthResult(BaseModel):
    success: bool
    student: Optional[StudentDB]
    reason: Optional[str]
    token: Optional[str]
