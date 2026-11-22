# Developing Blip

This guide is for working on Blip itself: the panel, the integration, new detection modes and releases. **Adding a sensor that fits an existing mode doesn't need any of this.** It's one profile file; see [CONTRIBUTING.md](../CONTRIBUTING.md).

> **The rule:** New sensor on Z2M = add a profile file. ZHA/Matter or any change to discovery/core = open an issue with your approach first and wait for approval.

## What you need

| Tool | Version | Used for |
|---|---|---|
| Node.js | 22 or newer | The panel, its tests and the catalog tools (`frontend/`) |
| Python | 3.13 (Home Assistant 2025.1) or 3.14 (latest Home Assistant) | Integration tests and the real Home Assistant boot test |
| Home Assistant | 2025.1 or newer, with a real sensor | Testing on hardware |

## How Blip fits together

Blip is two small pieces:

1. **The integration** (`custom_components/blip/`, Python). It adds the **Blip** page to Home Assistant's sidebar and serves the panel's JavaScript. It also provides **Download diagnostics**. It doesn't talk to sensors itself.
2. **The panel** (`frontend/`, TypeScript + [Lit](https://lit.dev)). It runs in the browser or phone app and gets Home Assistant's `hass` object directly. From that it finds sensors, draws them and calls services (press Track, set the band mask). There's no OAuth, CORS or API token.

Sensors are described by **profiles**: one JSON file per model in `profiles/`. The **catalog** (`catalog/sensors.json`) is the maintainer's list of which models are approved.

### Code map

| Path | What it does |
|---|---|
| `custom_components/blip/__init__.py` | Registers the sidebar panel and serves `frontend/blip-panel.js` (cache-busted by a content hash) |
| `custom_components/blip/config_flow.py` | One-click setup, single instance |
| `custom_components/blip/diagnostics.py` | Download diagnostics: versions plus detected sensors by role, with names, areas, entity ids and URLs left out |
| `custom_components/blip/frontend/` | **Generated.** `blip-panel.js` (the built panel) and `profiles.json` (match rules diagnostics reads) |
| `frontend/src/panel.ts` | The `<blip-panel>` element: sensor picker, status card, aim test, band editing, footer |
| `frontend/src/discovery.ts` | Finds sensors: device registry model first, then entity-name patterns. Plain Node-compatible; the profile checker runs it too. |
| `frontend/src/modes.ts` | **The list of modes Blip can draw** and the entity roles each one needs |
| `frontend/src/profile.ts` | Loads `profiles/*.json` into the bundle; the runtime guard skips any malformed profile |
| `frontend/src/fan.ts` | Band mode drawing (the SVG fan) and the band bitmask helpers |
| `frontend/src/aim.ts` | Aim-test logic: which band you're in, "lost you" detection, the status pill text |
| `frontend/src/brand.ts`, `styles.ts` | Wordmark, b mark and styles |
| `frontend/preview/` | `npm run dev`: the real panel driven by a simulated Home Assistant |
| `frontend/scripts/catalog.ts` | Eligibility and safety checks; generates SENSORS.md, the issue forms and the README's Help wanted line |
| `frontend/scripts/claims.ts` | Claim status: turns open **I'm building this** issues into the Status badges (run by the Claim status workflow) |
| `frontend/scripts/profile-check.ts`, `ha-export.jinja` | The profile checker (does a profile find a real sensor?) |
| `frontend/scripts/bundle-profiles.ts` | Writes `profiles.json` after the build |
| `profiles/` | One file per sensor model, plus `schema.json` and its [README](../profiles/README.md) |
| `catalog/` | Approved models (maintainer only) and `schema.json` |
| `tests/` | Integration tests (pytest) and `smoke/smoke.py`, which boots a real Home Assistant |
| `.github/workflows/` | CI, Contributor guard, Sync generated files, Claim status, Labels |
| `.github/scripts/` | Contributor guard rules and their self-test |

## Commands

From `frontend/`:

| Command | What it does |
|---|---|
| `npm install` | Install dependencies (once) |
| `npm run dev` | Preview with simulated FP300s. Add `?profile=<id>` for a sensor built from any profile, `?narrow=1` for the phone layout, `?none=1` for "no sensors". |
| `npm test` | Unit tests (panel, discovery, drawing, catalog rules, profile checker) |
| `npm run typecheck` | TypeScript checks |
| `npm run build` | Build `custom_components/blip/frontend/blip-panel.js` and `profiles.json` |
| `npm run catalog` | Regenerate SENSORS.md, the issue forms and the README's Help wanted line from the catalog |
| `npm run catalog:check` | Schema, eligibility and safety checks (what CI runs) |
| `npm run profile:check -- --states <export.json> ../profiles/<id>.json` | Does this profile find the sensor in a Home Assistant export? (See CONTRIBUTING for the export.) |

From the repository root:

```bash
pip install pytest-homeassistant-custom-component
pip install "$(python tests/frontend_requirement.py)"
pytest                        # integration tests
python tests/smoke/smoke.py   # boots a real Home Assistant, adds Blip, checks the panel and diagnostics
bash .github/scripts/test-contributor-guard.sh   # Contributor guard self-test
```

On Home Assistant 2025.1 the integration tests also need `pip install pycares==4.5.0` (a test-harness quirk; CI does this).

## Testing on your own Home Assistant

1. `npm run build` in `frontend/`.
2. Copy `custom_components/blip` into your Home Assistant's `config/custom_components/`, replacing any existing copy.
3. Restart Home Assistant and open **Blip**. The footer shows the version you built.
4. If the page still shows an old version, reset the frontend cache: in the phone app, **Settings → Companion app → Troubleshooting → Reset frontend cache**; in a browser, a hard reload.

## Adding a new mode (Cone, Map, Regions)

Modes are app code, so **open an issue with your approach first** and wait for approval. In outline:

1. **Register it** in `frontend/src/modes.ts`: add the mode and the entity roles it requires, e.g. `cone: { required: ["motion"] }`. Discovery, the catalog's "What it takes" column, the profile checker and diagnostics all read this list.
2. **Describe its geometry** in the profile format: add a mode-specific block to `profiles/schema.json` (as `band` is for Band mode), the matching type in `frontend/src/profile.ts`, and a check in the runtime guard `usable()`.
3. **Draw it**: put the drawing in its own module (like `fan.ts` for Band mode), and have `renderSensor()` in `panel.ts` choose the view by `profile.mode`. Band mode's aim test and band editing don't apply to every mode; show only what the sensor supports.
4. **Preview it**: `preview/mock.ts` builds a simulated sensor from any profile; extend it if your mode needs moving data (e.g. motion on and off, or X/Y targets).
5. **Test it**: unit tests for the drawing and logic (see `fan.test.ts` and `aim.test.ts`), a profile in `profiles/` for a real model, and a walk-test recording on real hardware.
6. Update `profiles/README.md` and the mode description in SENSORS.md (generated by `catalog.ts`).

ZHA or Matter support follows the same path: issue first. Usually it means profiles with `"integration": "zha"` or `"matter"` and discovery changes for how those integrations name entities.

## How changes land

1. **Pull request.** CI runs on every pull request: types, unit tests, catalog checks, a build, integration tests and a real Home Assistant boot on 2025.1 and the latest release, hassfest and HACS validation. **Contributor guard** checks contributor pull requests: one profile file, plus the testing details in the description.
2. **Review and merge.** `main` is protected: pull requests only, with the maintainer's review (CODEOWNERS). Only the maintainer merges.
3. **Sync generated files.** After a merge, a workflow rebuilds SENSORS.md, the issue forms, the README's Help wanted line, `blip-panel.js` and `profiles.json`. If anything changed, it opens a **Sync generated files** pull request. **Don't commit generated files in a contributor pull request.**
4. **Release.** Home Assistant users get changes only through a release (below).

**Claim status** runs whenever a claim issue opens, closes or changes (and daily). It writes one badge file per sensor or piece of integration work to the `claims` branch, which only that workflow writes; the SENSORS.md badges read it. Don't commit to `claims` or protect it.

Dependabot opens grouped dependency updates every Monday, and CI also runs weekly against the newest Home Assistant.

## Releasing (maintainer)

1. Open a release pull request that:
   - bumps `version` in `custom_components/blip/manifest.json` and `frontend/package.json`;
   - runs `npm run build` and commits the rebuilt `blip-panel.js` (its footer shows the version);
   - moves CHANGELOG.md's **Unreleased** section under the new version and date.
2. Merge it once CI is green.
3. Publish a GitHub release: **Releases → Draft a new release**, tag `vX.Y.Z` on `main`, title `Blip X.Y.Z`, notes from the changelog, not a pre-release.
4. The Marketplace and HACS offer the update from the release. HA 2026.3+ also picks up the brand images in `custom_components/blip/brand/` from it.
5. Update on a real Home Assistant and check the footer version, **Report a problem** and **Download diagnostics**.

Versions follow [semantic versioning](https://semver.org): new features bump the minor number (0.4.0), fixes and docs the patch number (0.4.1).
