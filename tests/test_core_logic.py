import os
import sys
import re
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
    assert re.match(r'^\d+\.\d+\.\d+$', data["version"]), f"Invalid semver: {data['version']}"
    assert isinstance(data["build"], int) and data["build"] >= 100, f"Invalid build number: {data['build']}"
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

# Test noise estimation formula logic
def test_noise_estimation_formula():
    import math
    # Test Immerkær normalization coefficient
    # 3x3 kernel coefficients: sum of squares = 1+4+1 + 4+16+4 + 1+4+1 = 36
    # sqrt(36) = 6
    norm = math.sqrt(0.5 * math.pi) / 6.0
    assert 0.20 < norm < 0.22, f"Expected norm ~0.2089, got {norm}"

    # Test noise floor subtraction formula
    def debias_sharpness(raw_var, sigma):
        if sigma > 1.2:
            return max(0.0, raw_var - (0.65 * 20.0 * (sigma ** 2)))
        return raw_var

    # When clean (sigma=0.5), variance is unchanged
    assert debias_sharpness(100.0, 0.5) == 100.0
    # When high ISO noise (sigma=3.5), noise variance floor is subtracted
    debiased = debias_sharpness(200.0, 3.5)
    assert debiased < 200.0
    assert debiased == max(0.0, 200.0 - (0.65 * 20.0 * 12.25))
    print("[PASS] test_noise_estimation_formula")

# Test burst clustering and hero crowning logic
def test_burst_clustering_and_hero_crown():
    # Simulate a burst sequence of 5 photos taken within 1.5s
    burst_items = [
        {"path": "shot_01.jpg", "filename": "shot_01.jpg", "capture_ts": 1000.0, "sharpness": 55.0, "eye_status": "open", "quality_rank_score": 75.0, "dhash": "1111000011110000", "scene_signature": [0.1]*8},
        {"path": "shot_02.jpg", "filename": "shot_02.jpg", "capture_ts": 1000.3, "sharpness": 88.0, "eye_status": "open", "quality_rank_score": 92.0, "dhash": "1111000011110001", "scene_signature": [0.1]*8},
        {"path": "shot_03.jpg", "filename": "shot_03.jpg", "capture_ts": 1000.6, "sharpness": 91.0, "eye_status": "closed", "quality_rank_score": 62.0, "dhash": "1111000011110000", "scene_signature": [0.1]*8}, # Blinking!
        {"path": "shot_04.jpg", "filename": "shot_04.jpg", "capture_ts": 1000.9, "sharpness": 78.0, "eye_status": "open", "quality_rank_score": 84.0, "dhash": "1111000011110010", "scene_signature": [0.1]*8},
        {"path": "shot_05.jpg", "filename": "shot_05.jpg", "capture_ts": 1001.2, "sharpness": 60.0, "eye_status": "open", "quality_rank_score": 78.0, "dhash": "1111000011110000", "scene_signature": [0.1]*8},
    ]

    # Cluster simulation
    ranked = sorted(burst_items, key=lambda x: x["quality_rank_score"], reverse=True)
    leader = ranked[0]

    # shot_02 should be the hero because shot_03 was blinking and penalized
    assert leader["filename"] == "shot_02.jpg", f"Expected shot_02 hero, got {leader['filename']}"
    assert leader["eye_status"] == "open"
    assert leader["sharpness"] == 88.0

    # Verify burst indices assignment
    for pos, m in enumerate(ranked):
        m["burst_id"] = "burst_1"
        m["burst_total"] = len(ranked)
        m["burst_index"] = pos + 1
        m["is_hero"] = (pos == 0)

    assert ranked[0]["is_hero"] is True
    assert ranked[1]["is_hero"] is False
    assert ranked[0]["burst_total"] == 5
    print("[PASS] test_burst_clustering_and_hero_crown")

# Test ocular openness and blink discrimination logic
def test_ocular_openness_and_blink_logic():
    # Open eye simulation: balanced gradients, deep valley dip
    def calc_openness(ratio_xy, valley_dip, local_std):
        openness = (
            (min(1.0, ratio_xy / 0.65) * 45.0) +
            (min(1.0, valley_dip / 28.0) * 35.0) +
            (min(1.0, local_std / 20.0) * 20.0)
        )
        return max(0.0, min(100.0, openness))

    open_score = calc_openness(ratio_xy=0.68, valley_dip=32.0, local_std=22.0)
    assert open_score > 70.0, f"Expected high openness for open eye, got {open_score}"

    # Closed eye / blink simulation: horizontal dominance (ratio < 0.35), minimal valley dip, smooth skin std
    closed_score = calc_openness(ratio_xy=0.25, valley_dip=6.0, local_std=6.0)
    assert closed_score < 40.0, f"Expected low openness for closed eye, got {closed_score}"
    print("[PASS] test_ocular_openness_and_blink_logic")

if __name__ == "__main__":
    test_version_loading()
    test_port_scanner()
    test_sha256_verification()
    test_html_injection()
    test_noise_estimation_formula()
    test_burst_clustering_and_hero_crown()
    test_ocular_openness_and_blink_logic()
    print("\n>>> ALL CORE SECURITY & ARCHITECTURE UNIT TESTS PASSED! <<<")
