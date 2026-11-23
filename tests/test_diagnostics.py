"""Blip's diagnostics: useful for debugging, with nothing personal in them."""

import json

from homeassistant import config_entries
from homeassistant.core import HomeAssistant
from homeassistant.helpers import area_registry as ar, device_registry as dr, entity_registry as er
from homeassistant.setup import async_setup_component
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.blip.const import DOMAIN

async def _download(hass: HomeAssistant, hass_client, entry) -> dict:
    """What "Download diagnostics" returns, through Home Assistant's own API."""
    assert await async_setup_component(hass, "diagnostics", {})
    client = await hass_client()
    response = await client.get(f"/api/diagnostics/config_entry/{entry.entry_id}")
    assert response.status == 200
    return (await response.json())["data"]


PRIVATE = ("Jordan", "Office", "jordan_office", "http", "192.168", "nabu")


async def _fp300(hass: HomeAssistant) -> None:
    """An FP300 the way Zigbee2MQTT registers it, in a named area."""
    mqtt = MockConfigEntry(domain="mqtt", title="MQTT broker at http://192.168.1.5")
    mqtt.add_to_hass(hass)
    area = ar.async_get(hass).async_create("Jordan's Office")
    device = dr.async_get(hass).async_get_or_create(
        config_entry_id=mqtt.entry_id,
        identifiers={("mqtt", "zigbee2mqtt_0x0000000000000001")},
        manufacturer="Aqara",
        model="Presence sensor FP300",
        model_id="PS-S04D",
        name="Jordan Office Presence",
        sw_version="0.0.0_6542",
        configuration_url="http://192.168.1.5:8080/#/device/1",
    )
    dr.async_get(hass).async_update_device(device.id, area_id=area.id)
    entities = er.async_get(hass)
    for domain, suffix, state, attrs in [
        ("number", "detection_range", "16777215", {"max": 16777215, "min": 0}),
        ("binary_sensor", "presence", "on", {}),
        ("binary_sensor", "pir_detection", "off", {}),
        ("sensor", "target_distance", "1.25", {"unit_of_measurement": "m"}),
        ("sensor", "battery", "100", {"unit_of_measurement": "%"}),
        ("button", "track_target_distance", "unknown", {}),
    ]:
        entry = entities.async_get_or_create(
            domain, "mqtt", f"0x01_{suffix}", suggested_object_id=f"jordan_office_presence_{suffix}", device_id=device.id
        )
        hass.states.async_set(entry.entity_id, state, {"friendly_name": f"Jordan Office Presence {suffix}", **attrs})


async def test_diagnostics(hass: HomeAssistant, hass_client) -> None:
    assert await async_setup_component(hass, "http", {})
    await _fp300(hass)
    result = await hass.config_entries.flow.async_init(DOMAIN, context={"source": config_entries.SOURCE_USER})
    result = await hass.config_entries.flow.async_configure(result["flow_id"], {})
    await hass.async_block_till_done()

    diag = await _download(hass, hass_client, result["result"])

    assert diag["blip_version"]
    assert diag["home_assistant_version"]
    assert diag["panel_registered"] is True
    assert diag["profiles_bundled"] == ["aqara_fp1", "aqara_fp300"]
    [sensor] = diag["sensors"]
    assert sensor["profile"] == "aqara_fp300"
    assert sensor["model"] == "Presence sensor FP300" and sensor["model_id"] == "PS-S04D"
    assert sensor["integrations"] == ["mqtt"]
    assert sensor["matched_by"] == "model" and sensor["usable"] is True
    assert sensor["entities"]["range"]["state"] == "16777215"
    assert sensor["entities"]["range"]["attributes"] == {"min": 0, "max": 16777215}
    assert sensor["entities"]["distance"]["attributes"] == {"unit_of_measurement": "m"}

    # Nothing personal: no device, area or entity names, no URLs or addresses.
    text = json.dumps(diag)
    for secret in PRIVATE:
        assert secret not in text, secret
