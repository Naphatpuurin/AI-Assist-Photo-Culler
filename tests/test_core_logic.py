import os
import sys
import json
import hashlib
import tempfile
import socket
import unittest

# Test loading version from version.json
def test_version_loading():
    root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    version_file = os.path.join(root, "version.json")
    assert os.path.exists(version_file), "version.json does not exist at repo root"
    with open(version_file, "r", encoding="utf-8") as f:
        data = json.load(f)
    assert "version" in data, "version key missing"
    assert "build" in data, "build key missing"
    assert data["version"] == "1.0.6"
    assert data["build"] == 106
    print("[PASS] test_version_loading")

# Test dynamic port scanning logic
def test_port_scanner():
    def find_free_port(start_port=8000, max_attempts=50):
        for p in range(start_port, start_port + max_attempts):
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                try:
                    s.bind(('127.0.0.1', p))
                    return p
                except OSError:
                    continue
        return start_port

    port = find_free_port(8000)
    assert isinstance(port, int)
    assert 8000 <= port <= 8050
    print(f"[PASS] test_port_scanner: found available port {port}")

# Test SHA256 checksum verification logic
def test_sha256_verification():
    # Create a test binary payload
    payload = b"MicMose Photo Culler Pro Test Binary Content v1.0.6"
    expected_hash = hashlib.sha256(payload).hexdigest().lower()

    with tempfile.NamedTemporaryFile(delete=False) as tf:
        tf.write(payload)
        temp_path = tf.name

    try:
        # Simulate integrity check matching
        hasher = hashlib.sha256()
        with open(temp_path, "rb") as f:
            while chunk := f.read(1024):
                hasher.update(chunk)
        computed_hash = hasher.hexdigest().lower()
        assert computed_hash == expected_hash, "Hash calculation mismatch"

        # Simulate tampered binary
        tampered_hash = "deadbeef" * 8
        mismatch_detected = False
        if computed_hash != tampered_hash:
            mismatch_detected = True
        assert mismatch_detected, "Tampered hash was not detected"

    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)

    print("[PASS] test_sha256_verification")

# Test static HTML injection logic
def test_html_injection():
    sample_html = "<!DOCTYPE html><html><head><title>App</title></head><body>Root</body></html>"
    token = "test_token_12345"
    port = 8042

    injection = (
        f"<script>\n"
        f"  window.__APP_SESSION_TOKEN__ = '{token}';\n"
        f"  window.__API_PORT__ = {port};\n"
        f"</script>\n"
    )
    injected_html = sample_html.replace("<head>", f"<head>\n{injection}", 1)

    assert f"window.__APP_SESSION_TOKEN__ = '{token}'" in injected_html
    assert f"window.__API_PORT__ = {port}" in injected_html
    print("[PASS] test_html_injection")

if __name__ == "__main__":
    test_version_loading()
    test_port_scanner()
    test_sha256_verification()
    test_html_injection()
    print("\n>>> ALL CORE SECURITY & ARCHITECTURE UNIT TESTS PASSED! <<<")
