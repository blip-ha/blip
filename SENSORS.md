<!-- Generated from catalog/sensors.json and profiles/. Don't edit by hand: run `npm run catalog` in frontend/. -->

# Sensors

**Modes:** **Band** shows distance bands. **Cone** lights the whole cone on motion. **Map** shows live positions of several people. **Regions** shows a zone grid. This version of Blip draws: **Band**.

## Supported

| Sensor | Mode | Integration | Notes |
|---|---|---|---|
| Aqara FP300 | Band | Zigbee2MQTT | 24 distance bands of 0.25 m, rated 120° / 6 m. |

## Help wanted

Approved for Blip but not built yet. Own one of these? See [CONTRIBUTING.md](CONTRIBUTING.md). Want one? Open a **Sensor request** issue.

| Sensor | Mode | Integration | Notes |
|---|---|---|---|
| Aqara FP1E | Band | Zigbee2MQTT | Zigbee2MQTT exposes presence, movement, target_distance and detection_range. |
| Aqara FP310 | Band | Zigbee2MQTT | Same distance and band controls as the FP300. China-market model; Zigbee2MQTT has an open bug where it stops responding. |
| Aqara FP1 | Regions | Zigbee2MQTT | Up to 10 regions on a 4×7 grid. Discontinued. |
| Aqara P1 motion sensor | Cone | Zigbee2MQTT | Occupancy, sensitivity and detection_interval (2–65535 s); about 170° / 7 m. Set detection_interval to its minimum during a test. |
| Aqara High Precision motion sensor (RTCGQ13LM) | Cone | Zigbee2MQTT | About 60° / 5 m. |
| Aqara P2 motion sensor | Cone | Thread/Matter | Thread/Matter device. |
| Aqara FP400 | Map | Zigbee2MQTT | Live X/Y positions through add-on Zigbee2MQTT converters. Plain Matter reports a single occupancy only. Several FP400 map cards already exist; Blip's version may sit alongside them. |

### Integration work

| Work | Notes |
|---|---|
| ZHA support | HA 2026.11's built-in FP300 quirk exposes only presence, PIR and battery, with an open bug where they never update. |
| Thread/Matter support | Whether distance and bands are available over Matter isn't confirmed. |

## Not eligible

| Sensor | Why |
|---|---|
| Aqara FP2 | Home Assistant gets no position data from it. |
| Anything else | Anything that doesn't detect people. |

Something else that detects people? Open a **New sensor proposal** issue.
