def test_worker_imports():
    import sys
    assert sys.version_info >= (3, 8)
