# Changelog

All notable changes to Blip. Versions follow the integration's `manifest.json`.

## Unreleased

### Docs
- New developer guide, [docs/development.md](docs/development.md): code map, commands, testing on your own Home Assistant, adding a mode, how changes land, and releasing.
- A **Help wanted** button and list at the top of the README: the sensors waiting for an owner, what each takes, and how to claim, build or request one. The list is generated from the catalog and stays current.

### Security
- Dependabot checks npm packages and GitHub Actions weekly, one grouped pull request per ecosystem.
- The HACS and hassfest validation actions are pinned to exact commits.

## 0.4.0 (2026-11-22)

### Added
- **Report a problem** link at the bottom of the Blip page: opens a bug report pre-filled with your Blip version, Home Assistant version and sensor model (no names or addresses).
- **Download diagnostics** on Blip's integration page: versions, your sensors' models and integrations, and the state of the entities Blip uses, with names, areas and URLs left out.

### For contributors
- **Profile checker:** `npm run profile:check` shows whether a sensor profile finds your sensor, from a Template export of your Home Assistant (no token) or a live read-only connection.
- **Preview any profile:** add `?profile=<id>` to the preview to see a simulated sensor built from it.
- **Simpler sensor pull requests:** contributors add only `profiles/<id>.json`; `SENSORS.md`, the issue forms and the panel bundle are rebuilt automatically after merge, so sensor pull requests don't conflict.
- **What it takes** column in SENSORS.md, a new **I'm building this** issue form, and a pull request template that asks for the Home Assistant version, the integration and a walk-test recording.
- Contributor guard rules moved into a script with a self-test that runs in CI.

### Changed
- CI runs weekly against the newest Home Assistant, runs once per pull request instead of twice, and uses current GitHub Actions versions.
- README screenshots show the full screen, including the legend.

## 0.3.2 (2026-11-22)

### Added
- Screenshots of the aim test, "lost you" and band editing in the README.

## 0.3.1 (2026-11-22)

### Added
- Blip's own icon and logo in Home Assistant (2026.3+) and the Marketplace, with light and dark versions.

### Changed
- The README header is a single image that reads the same on light and dark backgrounds.

## 0.3.0 (2026-11-22)

First public release.

- Blip sidebar page in Home Assistant, including the phone app. Home Assistant 2025.1 or newer; install from the Marketplace (2026.11+), HACS or manually.
- Aqara FP300 (Zigbee2MQTT): live 24-band detection fan, aim test with "lost you" detection, and band editing. While aiming, Blip re-sends Track every 10 minutes, after a confirmed band save, and when a band edit is cancelled.
- Sensor profiles (one JSON file per model) and a catalog of approved sensors in SENSORS.md, with issue forms, a contributor guide and checks that keep contributions safe.
