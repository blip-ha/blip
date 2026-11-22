"""End-to-end smoke test against a real Home Assistant install.

Boots `hass` with a throwaway config dir, onboards it, adds Blip through its config
flow, then checks the sidebar panel over the websocket API and fetches the panel JS.
Works on any HA version (no pytest-homeassistant-custom-component needed), so CI can
run it on the newest release.

Usage: python tests/smoke/smoke.py
"""

from __future__ import annotations

import asyncio
import os
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

import aiohttp

ROOT = Path(__file__).resolve().parents[2]
PORT = int(os.environ.get("BLIP_SMOKE_PORT", "18123"))
BASE = f"http://127.0.0.1:{PORT}"
CLIENT_ID = f"{BASE}/"


def fail(msg: str) -> None:
    print(f"FAIL: {msg}")
    raise SystemExit(1)


async def wait_up(session: aiohttp.ClientSession, proc: subprocess.Popen) -> None:
    for _ in range(180):
        if proc.poll() is not None:
            fail(f"hass exited early with code {proc.returncode}")
        try:
            async with session.get(f"{BASE}/api/onboarding") as r:
                if r.status == 200:
                    return
        except aiohttp.ClientError:
            pass
        await asyncio.sleep(1)
    fail("hass did not start within 180 s")


async def run(session: aiohttp.ClientSession) -> None:
    # Onboard: create the owner and get a token.
    async with session.post(
        f"{BASE}/api/onboarding/users",
        json={"client_id": CLIENT_ID, "name": "Smoke", "username": "smoke",
              "password": "smoke-pass-123", "language": "en"},
    ) as r:
        code = (await r.json())["auth_code"]
    async with session.post(
        f"{BASE}/auth/token",
        data={"grant_type": "authorization_code", "code": code, "client_id": CLIENT_ID},
    ) as r:
        token = (await r.json())["access_token"]
    auth = {"Authorization": f"Bearer {token}"}

    # Add Blip through its config flow.
    async with session.post(
        f"{BASE}/api/config/config_entries/flow", json={"handler": "blip"}, headers=auth
    ) as r:
        flow = await r.json()
        if flow.get("type") != "form":
            fail(f"config flow did not show its form: {flow}")
    async with session.post(
        f"{BASE}/api/config/config_entries/flow/{flow['flow_id']}", json={}, headers=auth
    ) as r:
        done = await r.json()
        if done.get("type") != "create_entry":
            fail(f"config flow did not create an entry: {done}")

    # Second attempt must be refused (single instance).
    async with session.post(
        f"{BASE}/api/config/config_entries/flow", json={"handler": "blip"}, headers=auth
    ) as r:
        again = await r.json()
        if again.get("reason") != "single_instance_allowed":
            fail(f"second Blip was not refused: {again}")

    # The sidebar panel, as the frontend sees it.
    async with session.ws_connect(f"{BASE}/api/websocket") as ws:
        await ws.receive_json()  # auth_required
        await ws.send_json({"type": "auth", "access_token": token})
        if (await ws.receive_json()).get("type") != "auth_ok":
            fail("websocket auth failed")
        await ws.send_json({"id": 1, "type": "get_panels"})
        panels = (await ws.receive_json())["result"]
    panel = panels.get("blip")
    if not panel:
        fail(f"no blip panel; panels: {sorted(panels)}")
    custom = panel["config"]["_panel_custom"]
    if (panel["title"], panel["icon"], panel["require_admin"]) != ("blip", "blip:mark", False):
        fail(f"unexpected panel: {panel}")
    if custom["name"] != "blip-panel":
        fail(f"unexpected element: {custom}")

    async with session.get(f"{BASE}{custom['module_url']}") as r:
        body = await r.text()
        if r.status != 200 or 'customElements.define("blip-panel"' not in body:
            fail(f"panel JS not served correctly ({r.status})")

    # "Download diagnostics" on Blip's integration page.
    entry_id = done["result"]["entry_id"]
    async with session.get(f"{BASE}/api/diagnostics/config_entry/{entry_id}", headers=auth) as r:
        if r.status != 200:
            fail(f"diagnostics download failed ({r.status})")
        diag = (await r.json())["data"]
        if not diag.get("blip_version") or diag.get("profiles_bundled") != ["aqara_fp300"]:
            fail(f"unexpected diagnostics: {diag}")

    async with session.get(f"{BASE}/api/config", headers=auth) as r:
        version = (await r.json())["version"]
    print(f"PASS: Blip panel registered and served, diagnostics downloadable, on Home Assistant {version}")


async def main() -> None:
    config = Path(tempfile.mkdtemp(prefix="blip-smoke-"))
    (config / "custom_components").mkdir()
    shutil.copytree(ROOT / "custom_components" / "blip", config / "custom_components" / "blip")
    (config / "configuration.yaml").write_text(
        f"default_config:\nhttp:\n  server_host: 127.0.0.1\n  server_port: {PORT}\n"
    )
    log = open(config / "hass.log", "w")
    proc = subprocess.Popen(
        [sys.executable, "-m", "homeassistant", "-c", str(config)], stdout=log, stderr=log
    )
    try:
        async with aiohttp.ClientSession() as session:
            await wait_up(session, proc)
            await run(session)
    except BaseException:
        log.flush()
        print((config / "hass.log").read_text()[-4000:])
        raise
    finally:
        proc.terminate()
        try:
            proc.wait(30)
        except subprocess.TimeoutExpired:
            proc.kill()
        shutil.rmtree(config, ignore_errors=True)


if __name__ == "__main__":
    asyncio.run(main())
