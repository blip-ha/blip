## What this changes

<!-- One or two sentences. For a new sensor: which model, and which issue it closes. -->

## Testing (required; a check reads this section)

Home Assistant version: <!-- e.g. 2026.11.2 (Settings → About) -->

Integration the sensor uses:
- [ ] Zigbee2MQTT
- [ ] ZHA
- [ ] Matter

Walk-test screen recording: <!-- Drag the video into this box. Record Blip on your phone with Aim test on while you walk away from the sensor and back, so the band lighting up and "lost you" are visible. -->

`npm run profile:check` output:

```
(paste here)
```

## Checklist

- [ ] The sensor is listed under **Help wanted** in [SENSORS.md](../SENSORS.md) (approved by the maintainer).
- [ ] This pull request adds only `profiles/<id>.json` (generated files are rebuilt after merge).
- [ ] `npm test` and `npm run catalog:check` pass in `frontend/`.
- [ ] Aim test and Edit bands behave as expected on my sensor (or: what doesn't, and why).
