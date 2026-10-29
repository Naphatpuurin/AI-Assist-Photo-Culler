import sys
import os

try:
    import pytest
    from fastapi.testclient import TestClient
    HAS_DEPS = True
except ImportError:
    HAS_DEPS = False

if HAS_DEPS:
    # Add backend to path
    sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))

    from main import app, APP_SESSION_TOKEN, CURRENT_PORT, APP_VERSION, APP_BUILD

    client = TestClient(app)

    def test_root_index_injection():
        response = client.get("/")
        assert response.status_code == 200
        html = response.text
        assert f"window.__APP_SESSION_TOKEN__ = '{APP_SESSION_TOKEN}'" in html
        assert f"window.__API_PORT__ = {CURRENT_PORT}" in html
        assert "app_token" in response.cookies

    def test_api_denied_without_token():
        response = client.get("/api/hardware_status", headers={"origin": "http://evil-attacker.com"})
        assert response.status_code == 403
        data = response.json()
        assert data["status"] == "error"

    def test_api_allowed_with_header_token():
        response = client.get("/api/hardware_status", headers={"X-App-Token": APP_SESSION_TOKEN})
        assert response.status_code == 200
        data = response.json()
        assert data["app_version"] == APP_VERSION
        assert data["app_build"] == APP_BUILD
        assert data["app_port"] == CURRENT_PORT

    def test_api_allowed_with_query_token():
        response = client.get(f"/api/hardware_status?token={APP_SESSION_TOKEN}")
        assert response.status_code == 200
        data = response.json()
        assert data["app_version"] == APP_VERSION

    def test_api_allowed_with_cookie_token():
        response = client.get("/api/hardware_status", cookies={"app_token": APP_SESSION_TOKEN})
        assert response.status_code == 200
        data = response.json()
        assert data["app_version"] == APP_VERSION

if __name__ == "__main__":
    if HAS_DEPS:
        test_root_index_injection()
        test_api_denied_without_token()
        test_api_allowed_with_header_token()
        test_api_allowed_with_query_token()
        test_api_allowed_with_cookie_token()
        print("[ALL SECURITY & ENDPOINT TESTS PASSED SUCCESSFULLY]")
    else:
        print("[SKIPPED] fastapi or testclient not in current environment, run inside venv")

