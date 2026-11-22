"""Constants for Blip."""

from pathlib import Path

DOMAIN = "blip"

PANEL_URL_PATH = "blip"
PANEL_TITLE = "Blip"
PANEL_ICON = "mdi:radar"
PANEL_ELEMENT = "blip-panel"

STATIC_URL = "/blip_static"
FRONTEND_DIR = Path(__file__).parent / "frontend"
FRONTEND_FILE = "blip-panel.js"
