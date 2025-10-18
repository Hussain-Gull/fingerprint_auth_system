from sqlalchemy import Table, Column, Integer, String, Text, DateTime, Boolean, LargeBinary
from sqlalchemy.orm import declarative_base
from sqlalchemy.sql import func
from app.db.db import metadata

Base = declarative_base()

applications = Table(
    "applications",
    metadata,
    Column("id", Integer, primary_key=True),
    Column("full_name", String(15), nullable=False),
    Column("father_name", String(15)),
    Column("date_of_birth", String(32)),
    Column("gender", String(10)),
    Column("country", String(10)),
    Column("identity_number", String(13), unique=True, nullable=False),
    Column("address", String(100)),
    Column("subject", String(25)),
    Column("cnic_front_path", String(256), nullable=True),
    Column("cnic_back_path", String(256), nullable=True),
    Column("student_image_path", String(256), nullable=True),
    Column("fingerprint_encrypted", LargeBinary, nullable=True),  # encrypted template
    Column("created_at", DateTime(timezone=True), server_default=func.now()),
)

sessions = Table(
    "scan_sessions",
    metadata,
    Column("id", Integer, primary_key=True),
    Column("identity_number", String(32), nullable=False),
    Column("full_name", String(64), nullable=False),
    Column("session_token", String(128), nullable=False, unique=True),
    Column("expires_at", DateTime(timezone=True)),
    Column("active", Boolean, default=True),
    Column("created_at", DateTime(timezone=True), server_default=func.now()),
)

# Create admins table using metadata to ensure it's included in create_all
admins = Table(
    "admins",
    metadata,
    Column("id", Integer, primary_key=True, index=True),
    Column("username", String(50), unique=True, nullable=False),
    Column("password", String(255), nullable=False),
)

class Admin(Base):
    __tablename__ = "admins"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False)
    password = Column(String(255), nullable=False)
