"""Blip: aim presence sensors from a Home Assistant sidebar panel."""

from __future__ import annotations

import hashlib

from homeassistant.components import frontend, panel_custom
from homeassistant.components.http import StaticPathConfig
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant

from .const import (
    DOMAIN,
    FRONTEND_DIR,
    FRONTEND_FILE,
    ICONS_FILE,
    PANEL_ELEMENT,
    PANEL_ICON,
    PANEL_TITLE,
    PANEL_URL_PATH,
    STATIC_URL,
)


def _file_hash(name: str = FRONTEND_FILE) -> str:
    """Short content hash, so browsers and the phone app load a new build right away."""
    return hashlib.sha256((FRONTEND_DIR / name).read_bytes()).hexdigest()[:12]


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Serve the panel's JS and add Blip to the sidebar."""
    data = hass.data.setdefault(DOMAIN, {})
    # Static paths can't be removed, so register once per HA run (survives entry reloads).
    if not data.get("static_registered"):
        await hass.http.async_register_static_paths(
            [StaticPathConfig(STATIC_URL, str(FRONTEND_DIR), cache_headers=False)]
        )
        data["static_registered"] = True

    # The "blip:" icon set for the sidebar entry. It loads with every Home Assistant page,
    # so the icon shows before the panel itself has been opened.
    icons_url = f"{STATIC_URL}/{ICONS_FILE}?v={await hass.async_add_executor_job(_file_hash, ICONS_FILE)}"
    frontend.add_extra_js_url(hass, icons_url)
    data["icons_url"] = icons_url

    version = await hass.async_add_executor_job(_file_hash)
    await panel_custom.async_register_panel(
        hass,
        webcomponent_name=PANEL_ELEMENT,
        frontend_url_path=PANEL_URL_PATH,
        module_url=f"{STATIC_URL}/{FRONTEND_FILE}?v={version}",
        sidebar_title=PANEL_TITLE,
        sidebar_icon=PANEL_ICON,
        require_admin=False,
        config={},
        embed_iframe=False,
    )
    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Remove Blip from the sidebar."""
    frontend.async_remove_panel(hass, PANEL_URL_PATH)
    if icons_url := hass.data.get(DOMAIN, {}).pop("icons_url", None):
        frontend.remove_extra_js_url(hass, icons_url)
    return True
