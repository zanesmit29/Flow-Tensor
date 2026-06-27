"""Tests for rate limiting and input size guard on /api/parse."""

import time
from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient

from main import app, _rate_windows, _RATE_LIMIT_MAX_REQUESTS, _MAX_CODE_SIZE


@pytest.fixture(autouse=True)
def clear_rate_state():
    """Clear rate-limit state between tests."""
    _rate_windows.clear()
    yield
    _rate_windows.clear()


@pytest.fixture
def client():
    return TestClient(app)


VALID_CODE = "import pandas as pd\ndf = pd.read_csv('x.csv')\n"
SESSION_HEADER = "X-FlowTensor-Session"


class TestRateLimiting:
    def test_requests_within_limit_succeed(self, client):
        for _ in range(5):
            resp = client.post(
                "/api/parse",
                json={"code": VALID_CODE},
                headers={SESSION_HEADER: "session-ok"},
            )
            assert resp.status_code == 200

    def test_exceeding_limit_returns_429(self, client):
        sid = "session-spam"
        # Fill up the window
        for _ in range(_RATE_LIMIT_MAX_REQUESTS):
            resp = client.post(
                "/api/parse",
                json={"code": VALID_CODE},
                headers={SESSION_HEADER: sid},
            )
            assert resp.status_code == 200

        # Next request should be rate limited
        resp = client.post(
            "/api/parse",
            json={"code": VALID_CODE},
            headers={SESSION_HEADER: sid},
        )
        assert resp.status_code == 429
        assert "rate limit" in resp.json()["error"].lower()

    def test_different_sessions_have_independent_limits(self, client):
        # Exhaust session A
        for _ in range(_RATE_LIMIT_MAX_REQUESTS):
            client.post(
                "/api/parse",
                json={"code": VALID_CODE},
                headers={SESSION_HEADER: "session-a"},
            )

        # Session A is blocked
        resp = client.post(
            "/api/parse",
            json={"code": VALID_CODE},
            headers={SESSION_HEADER: "session-a"},
        )
        assert resp.status_code == 429

        # Session B still works
        resp = client.post(
            "/api/parse",
            json={"code": VALID_CODE},
            headers={SESSION_HEADER: "session-b"},
        )
        assert resp.status_code == 200

    def test_window_expires_and_requests_succeed_again(self, client):
        sid = "session-expire"
        # Pretend all requests happened 61 seconds ago
        _rate_windows[sid] = [time.time() - 61] * _RATE_LIMIT_MAX_REQUESTS

        # Should succeed because old timestamps are pruned
        resp = client.post(
            "/api/parse",
            json={"code": VALID_CODE},
            headers={SESSION_HEADER: sid},
        )
        assert resp.status_code == 200


class TestInputSizeGuard:
    def test_code_within_limit_succeeds(self, client):
        code = "x = 1\n" * 100  # small
        resp = client.post("/api/parse", json={"code": code})
        # Should parse (may be 200 or 422 depending on content, but not size error)
        assert resp.status_code in (200, 422)
        if resp.status_code == 422:
            assert "too large" not in resp.json()["error"].lower()

    def test_code_exceeding_limit_returns_422(self, client):
        code = "x = 1\n" * ((_MAX_CODE_SIZE // 6) + 1000)  # exceeds 50KB
        resp = client.post("/api/parse", json={"code": code})
        assert resp.status_code == 422
        body = resp.json()
        assert "too large" in body["error"].lower()
        assert "50" in body["error"]  # mentions the limit

    def test_exactly_at_limit_succeeds(self, client):
        # Build code that's exactly at the limit
        code = "a" * _MAX_CODE_SIZE
        resp = client.post("/api/parse", json={"code": code})
        # Should not trigger size guard (may fail parse, but not size error)
        assert resp.status_code in (200, 422)
        if resp.status_code == 422:
            assert "too large" not in resp.json()["error"].lower()

    def test_one_byte_over_limit_fails(self, client):
        code = "a" * (_MAX_CODE_SIZE + 1)
        resp = client.post("/api/parse", json={"code": code})
        assert resp.status_code == 422
        assert "too large" in resp.json()["error"].lower()
