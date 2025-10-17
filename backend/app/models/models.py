from sqlalchemy import Table, Column, Integer, String, Text, DateTime, Boolean, LargeBinary
from sqlalchemy.sql import func
from app.db import metadata

applications = Table(
    "applications",
    metadata,
    Column("id", Integer, primary_key=True),
    Column("full_name", String(64), nullable=False),
    Column("father_name", String(64)),
    Column("date_of_birth", String(32)),
    Column("gender", String(16)),
    Column("country", String(32)),
    Column("identity_number", String(32), unique=True, nullable=False),
    Column("address", String(256)),
    Column("subject", String(64)),
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
