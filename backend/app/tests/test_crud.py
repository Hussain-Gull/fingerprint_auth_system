import pytest
from ..crud import create_student, get_student_by_cnic
from ..database import SessionLocal
from ..schemas import StudentCreate

def test_create_student(tmp_path, monkeypatch):
    db = SessionLocal()
    s_in = StudentCreate(name="Test", cnic_number="1234")
    student = create_student(db, s_in, b"FAKE_TEMPLATE")
    assert student.cnic_number == "1234"
    db.delete(student)
    db.commit()
    db.close()
