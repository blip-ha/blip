"""Diagnostics for Blip: Settings → Devices & services → Blip → ⋮ → Download diagnostics.

Lists what Blip needs to debug a sensor problem without anything personal: versions, and for
each sensor Blip recognizes its profile, model and integration plus the state of each entity
Blip uses, keyed by role ("range", "presence", ...). Device names, entity ids (which contain
names), areas and URLs are left out.
"""

from __future__ import annotations

import json
from typing import Any

from homeassistant.components import frontend
from homeassistant.config_entries import ConfigEntry
from homeassistant.const import __version__ as HA_VERSION
from homeassistant.core import HomeAssistant, State
from homeassistant.helpers import device_registry as dr, entity_registry as er
from homeassistant.loader import async_get_integration

from .const import DOMAIN, FRONTEND_DIR, PANEL_URL_PATH

PROFILES_FILE = FRONTEND_DIR / "profiles.json"
# State attributes worth seeing; everything else (friendly_name, icons, ...) is left out.
KEEP_ATTRIBUTES = ("min", "max", "step", "unit_of_measurement", "device_class")


def _load_profiles() -> list[dict[str, Any]]:
    try:
        return json.loads(PROFILES_FILE.read_text(encoding="utf-8"))["profiles"]
    except (OSError, ValueError, KeyError):
        return []


def _same(a: str | None, b: str | None) -> bool:
    return bool(a) and bool(b) and a.strip().lower() == b.strip().lower()


def _device_matches(device: dr.DeviceEntry, rule: dict[str, str]) -> bool:
    return all(_same(getattr(device, key, None), value) for key, value in rule.items())


def _entity_matches(entity_id: str, state: State | None, rule: dict[str, Any]) -> bool:
    if not entity_id.startswith(rule["domain"] + ".") or not entity_id.endswith(rule["suffix"]):
        return False
    if "max" in rule:
        try:
            return state is not None and float(state.attributes.get("max")) == float(rule["max"])
        except (TypeError, ValueError):
            return False
    return True


def _state_summary(state: State | None) -> dict[str, Any]:
    if state is None:
        return {"state": None}
    return {
        "state": state.state,
        "attributes": {k: state.attributes[k] for k in KEEP_ATTRIBUTES if k in state.attributes},
        "last_updated": state.last_updated.isoformat(),
    }


async def async_get_config_entry_diagnostics(hass: HomeAssistant, entry: ConfigEntry) -> dict[str, Any]:
    """Return Blip's diagnostics."""
    integration = await async_get_integration(hass, DOMAIN)
    profiles = await hass.async_add_executor_job(_load_profiles)
    devices = dr.async_get(hass)
    entities = er.async_get(hass)

    sensors: list[dict[str, Any]] = []
    for device in devices.devices.values():
        ids = [e.entity_id for e in er.async_entries_for_device(entities, device.id)]
        model_profiles = [
            profile for profile in profiles
            if any(_device_matches(device, rule) for rule in profile["match"]["devices"])
        ]
        candidates = model_profiles or [
            profile for profile in profiles
            if "range" in profile["required"]
        ]
        for profile in candidates:
            by_model = any(_device_matches(device, rule) for rule in profile["match"]["devices"])
            roles: dict[str, Any] = {}
            for role, rule in profile["entities"].items():
                hit = next((i for i in ids if _entity_matches(i, hass.states.get(i), rule)), None)
                roles[role] = _state_summary(hass.states.get(hit)) if hit else "not found"
            has_required = all(roles.get(r) != "not found" for r in profile["required"])
            if not by_model and not has_required:
                continue
            integrations = sorted(
                e.domain for e in (hass.config_entries.async_get_entry(i) for i in device.config_entries) if e
            )
            sensors.append(
                {
                    "profile": profile["id"],
                    "manufacturer": device.manufacturer,
                    "model": device.model,
                    "model_id": device.model_id,
                    "sw_version": device.sw_version,
                    "integrations": integrations,
                    "matched_by": "model" if by_model else "entities",
                    "usable": has_required,
                    "entities": roles,
                }
            )
            break

    return {
        "blip_version": str(integration.version),
        "home_assistant_version": HA_VERSION,
        "panel_registered": PANEL_URL_PATH in hass.data.get(frontend.DATA_PANELS, {}),
        "profiles_bundled": [p["id"] for p in profiles],
        "sensors": sensors,
    }
