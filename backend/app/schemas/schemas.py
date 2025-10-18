from typing import Optional, List

from pydantic import BaseModel, Field, constr
from datetime import datetime


class AdminLogin(BaseModel):
    username: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class ApplicationCreate(BaseModel):
    fullName: constr(min_length=1, max_length=15)
    fatherName: constr(min_length=1, max_length=15)
    dateOfBirth: str
    gender: constr(min_length=1, max_length=10)
    country: constr(min_length=1, max_length=10)
    identityNumber: constr(min_length=13, max_length=13)
    address: constr(min_length=1, max_length=100)
    subject: str
    # files will be sent as multipart separately


class ApplicationResponse(BaseModel):
    identityNumber: str
    fullName: str


class ApplicationListItem(BaseModel):
    id: int
    full_name: str
    father_name: Optional[str]
    identity_number: str
    subject: Optional[str]
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class PaginatedApplications(BaseModel):
    total: int
    page: int
    per_page: int
    applications: List[ApplicationListItem]
