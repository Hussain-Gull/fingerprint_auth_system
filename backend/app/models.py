import uuid
from sqlalchemy import Column, String, Integer, Date, LargeBinary, DateTime, func, Text
from sqlalchemy.dialects.postgresql import UUID
from .database import Base

class Student(Base):
    __tablename__ = "students"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(Text, nullable=False)
    age = Column(Integer, nullable=True)
    father_name = Column(Text, nullable=True)
    gender = Column(String(10), nullable=True)
    country = Column(String(100), nullable=True)
    cnic_number = Column(String(50), unique=True, nullable=False)
    date_of_birth = Column(Date, nullable=True)
    date_of_issue = Column(Date, nullable=True)
    date_of_expiry = Column(Date, nullable=True)
    address = Column(Text, nullable=True)
    fingerprint_template = Column(LargeBinary, nullable=False)  # store template (not image)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
