from ..secugen_binding import SecuGen
def test_secugen_stub_connect():
    # The stub will not be connected unless SDK path exists; ensure method returns bool
    ok = SecuGen.connect()
    assert isinstance(ok, bool)
    # test capture_template returns tuple
    ok2, temp = SecuGen.capture_template()
    assert isinstance(ok2, bool)
