"""create students table

Revision ID: 0001_create_students_table
Revises:
Create Date: 2025-10-13 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
import sqlalchemy.dialects.postgresql as pg

# revision identifiers, used by Alembic.
revision = '0001_create_students_table'
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    op.create_table(
        'students',
        sa.Column('id', pg.UUID(as_uuid=True), primary_key=True),
        sa.Column('name', sa.Text, nullable=False),
        sa.Column('age', sa.Integer, nullable=True),
        sa.Column('father_name', sa.Text, nullable=True),
        sa.Column('gender', sa.String(length=10), nullable=True),
        sa.Column('country', sa.String(length=100), nullable=True),
        sa.Column('cnic_number', sa.String(length=50), nullable=False, unique=True),
        sa.Column('date_of_birth', sa.Date, nullable=True),
        sa.Column('date_of_issue', sa.Date, nullable=True),
        sa.Column('date_of_expiry', sa.Date, nullable=True),
        sa.Column('address', sa.Text, nullable=True),
        sa.Column('fingerprint_template', sa.LargeBinary, nullable=False),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()')),
        sa.Column('updated_at', sa.TIMESTAMP(timezone=True), nullable=True),
    )

def downgrade():
    op.drop_table('students')
