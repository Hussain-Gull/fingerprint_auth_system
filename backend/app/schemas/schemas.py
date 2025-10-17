from pydantic import BaseModel, Field, constr
from typing import Optional

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
