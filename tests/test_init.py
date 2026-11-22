"""Blip registers its sidebar panel and serves the panel JS."""

from homeassistant import config_entries
from homeassistant.components import frontend
from homeassistant.core import HomeAssistant
from homeassistant.data_entry_flow import FlowResultType
from homeassistant.setup import async_setup_component

from custom_components.blip.const import DOMAIN, PANEL_URL_PATH


async def _add(hass: HomeAssistant):
    assert await async_setup_component(hass, "http", {})
    result = await hass.config_entries.flow.async_init(
        DOMAIN, context={"source": config_entries.SOURCE_USER}
    )
    assert result["type"] is FlowResultType.FORM
    result = await hass.config_entries.flow.async_configure(result["flow_id"], {})
    assert result["type"] is FlowResultType.CREATE_ENTRY
    await hass.async_block_till_done()
    return result["result"]


async def test_panel_lifecycle(hass: HomeAssistant, hass_client) -> None:
    entry = await _add(hass)

    panel = hass.data[frontend.DATA_PANELS][PANEL_URL_PATH]
    d = panel.to_response()
    assert d["title"] == "blip"
    assert d["icon"] == "blip:mark"
    assert d["require_admin"] is False
    module_url = d["config"]["_panel_custom"]["module_url"]
    assert d["config"]["_panel_custom"]["name"] == "blip-panel"
    assert module_url.startswith("/blip_static/blip-panel.js?v=")

    client = await hass_client()
    resp = await client.get(module_url)
    assert resp.status == 200
    assert 'customElements.define("blip-panel"' in await resp.text()

    # The sidebar icon set loads on every page.
    icons_url = hass.data[DOMAIN]["icons_url"]
    assert icons_url.startswith("/blip_static/blip-icons.js?v=")
    assert icons_url in hass.data[frontend.DATA_EXTRA_MODULE_URL].urls
    resp = await client.get(icons_url)
    assert resp.status == 200
    assert "window.customIcons.blip" in await resp.text()

    # Reload keeps working (static path is registered only once).
    assert await hass.config_entries.async_reload(entry.entry_id)
    await hass.async_block_till_done()
    assert PANEL_URL_PATH in hass.data[frontend.DATA_PANELS]

    assert await hass.config_entries.async_unload(entry.entry_id)
    await hass.async_block_till_done()
    assert PANEL_URL_PATH not in hass.data[frontend.DATA_PANELS]
    assert icons_url not in hass.data[frontend.DATA_EXTRA_MODULE_URL].urls


async def test_single_instance(hass: HomeAssistant) -> None:
    await _add(hass)
    result = await hass.config_entries.flow.async_init(
        DOMAIN, context={"source": config_entries.SOURCE_USER}
    )
    assert result["type"] is FlowResultType.ABORT
    assert result["reason"] == "single_instance_allowed"
