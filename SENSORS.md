<!-- Generated from catalog/sensors.json and profiles/. Don't edit by hand: run `npm run catalog` in frontend/. -->

# Sensors

**Modes:** **Band** shows distance bands. **Cone** lights the whole cone on motion. **Map** shows live positions of several people. **Regions** shows a zone grid. This version of Blip draws: **Band**.

## Supported

| Sensor | Mode | Integration | Notes |
|---|---|---|---|
| Aqara FP300 | Band | Zigbee2MQTT | 24 distance bands of 0.25 m, rated 120° / 6 m. |

## Help wanted

Approved for Blip but not built yet. Own one of these? Check its **Status** (🟢 **open**, or the name of whoever is building it), tap **🙋 I'll build this**, then follow [CONTRIBUTING.md](CONTRIBUTING.md). Want one? Open a **Sensor request** issue.

**What it takes:** **Profile file** means one JSON file and no code. **Issue first** means it needs a mode Blip can't draw yet, or ZHA/Matter support: open an issue with your approach and wait for approval before writing code.

| Sensor | Mode | Integration | What it takes | Status | Sign up | Notes |
|---|---|---|---|---|---|---|
| Aqara FP1E | Band | Zigbee2MQTT | **Profile file** | [![Status](https://img.shields.io/endpoint?url=https%3A%2F%2Fraw.githubusercontent.com%2Fblip-ha%2Fblip%2Fclaims%2Fstatus%2Faqara_fp1e.json)](https://github.com/blip-ha/blip/issues?q=is%3Aissue%20is%3Aopen%20label%3A%22in%20progress%22%20%22Aqara%20FP1E%20%28Profile%20file%29%22%20in%3Abody) | **[🙋 I'll build this](https://github.com/blip-ha/blip/issues/new?template=sensor_claim.yml&title=Building%3A%20Aqara%20FP1E&sensor=Aqara%20FP1E%20%28Profile%20file%29&integration=Zigbee2MQTT&approach=Add%20a%20profile%20file.)** | Zigbee2MQTT exposes presence, movement, target_distance and detection_range. |
| Aqara FP310 | Band | Zigbee2MQTT | **Profile file** | [![Status](https://img.shields.io/endpoint?url=https%3A%2F%2Fraw.githubusercontent.com%2Fblip-ha%2Fblip%2Fclaims%2Fstatus%2Faqara_fp310.json)](https://github.com/blip-ha/blip/issues?q=is%3Aissue%20is%3Aopen%20label%3A%22in%20progress%22%20%22Aqara%20FP310%20%28Profile%20file%29%22%20in%3Abody) | **[🙋 I'll build this](https://github.com/blip-ha/blip/issues/new?template=sensor_claim.yml&title=Building%3A%20Aqara%20FP310&sensor=Aqara%20FP310%20%28Profile%20file%29&integration=Zigbee2MQTT&approach=Add%20a%20profile%20file.)** | Same distance and band controls as the FP300. China-market model; Zigbee2MQTT has an open bug where it stops responding. |
| Aqara FP1 | Regions | Zigbee2MQTT | **Issue first: new Regions mode** | [![Status](https://img.shields.io/endpoint?url=https%3A%2F%2Fraw.githubusercontent.com%2Fblip-ha%2Fblip%2Fclaims%2Fstatus%2Faqara_fp1.json)](https://github.com/blip-ha/blip/issues?q=is%3Aissue%20is%3Aopen%20label%3A%22in%20progress%22%20%22Aqara%20FP1%20%28Issue%20first%3A%20new%20Regions%20mode%29%22%20in%3Abody) | **[🙋 I'll build this](https://github.com/blip-ha/blip/issues/new?template=sensor_claim.yml&title=Building%3A%20Aqara%20FP1&sensor=Aqara%20FP1%20%28Issue%20first%3A%20new%20Regions%20mode%29)** | Up to 10 regions on a 4×7 grid. Discontinued. |
| Aqara P1 motion sensor | Cone | Zigbee2MQTT | **Issue first: new Cone mode** | [![Status](https://img.shields.io/endpoint?url=https%3A%2F%2Fraw.githubusercontent.com%2Fblip-ha%2Fblip%2Fclaims%2Fstatus%2Faqara_p1.json)](https://github.com/blip-ha/blip/issues?q=is%3Aissue%20is%3Aopen%20label%3A%22in%20progress%22%20%22Aqara%20P1%20motion%20sensor%20%28Issue%20first%3A%20new%20Cone%20mode%29%22%20in%3Abody) | **[🙋 I'll build this](https://github.com/blip-ha/blip/issues/new?template=sensor_claim.yml&title=Building%3A%20Aqara%20P1%20motion%20sensor&sensor=Aqara%20P1%20motion%20sensor%20%28Issue%20first%3A%20new%20Cone%20mode%29)** | Occupancy, sensitivity and detection_interval (2–65535 s); about 170° / 7 m. Set detection_interval to its minimum during a test. |
| Aqara High Precision motion sensor (RTCGQ13LM) | Cone | Zigbee2MQTT | **Issue first: new Cone mode** | [![Status](https://img.shields.io/endpoint?url=https%3A%2F%2Fraw.githubusercontent.com%2Fblip-ha%2Fblip%2Fclaims%2Fstatus%2Faqara_rtcgq13lm.json)](https://github.com/blip-ha/blip/issues?q=is%3Aissue%20is%3Aopen%20label%3A%22in%20progress%22%20%22Aqara%20High%20Precision%20motion%20sensor%20%28RTCGQ13LM%29%20%28Issue%20first%3A%20new%20Cone%20mode%29%22%20in%3Abody) | **[🙋 I'll build this](https://github.com/blip-ha/blip/issues/new?template=sensor_claim.yml&title=Building%3A%20Aqara%20High%20Precision%20motion%20sensor%20%28RTCGQ13LM%29&sensor=Aqara%20High%20Precision%20motion%20sensor%20%28RTCGQ13LM%29%20%28Issue%20first%3A%20new%20Cone%20mode%29)** | About 60° / 5 m. |
| Aqara P2 motion sensor | Cone | Thread/Matter | **Issue first: new Cone mode, Thread/Matter** | [![Status](https://img.shields.io/endpoint?url=https%3A%2F%2Fraw.githubusercontent.com%2Fblip-ha%2Fblip%2Fclaims%2Fstatus%2Faqara_p2.json)](https://github.com/blip-ha/blip/issues?q=is%3Aissue%20is%3Aopen%20label%3A%22in%20progress%22%20%22Aqara%20P2%20motion%20sensor%20%28Issue%20first%3A%20new%20Cone%20mode%2C%20Thread%2FMatter%29%22%20in%3Abody) | **[🙋 I'll build this](https://github.com/blip-ha/blip/issues/new?template=sensor_claim.yml&title=Building%3A%20Aqara%20P2%20motion%20sensor&sensor=Aqara%20P2%20motion%20sensor%20%28Issue%20first%3A%20new%20Cone%20mode%2C%20Thread%2FMatter%29)** | Thread/Matter device. |
| Aqara FP400 | Map | Zigbee2MQTT | **Issue first: new Map mode** | [![Status](https://img.shields.io/endpoint?url=https%3A%2F%2Fraw.githubusercontent.com%2Fblip-ha%2Fblip%2Fclaims%2Fstatus%2Faqara_fp400.json)](https://github.com/blip-ha/blip/issues?q=is%3Aissue%20is%3Aopen%20label%3A%22in%20progress%22%20%22Aqara%20FP400%20%28Issue%20first%3A%20new%20Map%20mode%29%22%20in%3Abody) | **[🙋 I'll build this](https://github.com/blip-ha/blip/issues/new?template=sensor_claim.yml&title=Building%3A%20Aqara%20FP400&sensor=Aqara%20FP400%20%28Issue%20first%3A%20new%20Map%20mode%29)** | Live X/Y positions through add-on Zigbee2MQTT converters. Plain Matter reports a single occupancy only. Several FP400 map cards already exist; Blip's version may sit alongside them. |

### Integration work

Always **Issue first**.

| Work | Status | Sign up | Notes |
|---|---|---|---|
| ZHA support | [![Status](https://img.shields.io/endpoint?url=https%3A%2F%2Fraw.githubusercontent.com%2Fblip-ha%2Fblip%2Fclaims%2Fstatus%2Fzha.json)](https://github.com/blip-ha/blip/issues?q=is%3Aissue%20is%3Aopen%20label%3A%22in%20progress%22%20%22ZHA%20support%20%28Issue%20first%29%22%20in%3Abody) | **[🙋 I'll build this](https://github.com/blip-ha/blip/issues/new?template=sensor_claim.yml&title=Building%3A%20ZHA%20support&sensor=ZHA%20support%20%28Issue%20first%29&integration=ZHA)** | HA 2026.11's built-in FP300 quirk exposes only presence, PIR and battery, with an open bug where they never update. |
| Thread/Matter support | [![Status](https://img.shields.io/endpoint?url=https%3A%2F%2Fraw.githubusercontent.com%2Fblip-ha%2Fblip%2Fclaims%2Fstatus%2Fmatter.json)](https://github.com/blip-ha/blip/issues?q=is%3Aissue%20is%3Aopen%20label%3A%22in%20progress%22%20%22Thread%2FMatter%20support%20%28Issue%20first%29%22%20in%3Abody) | **[🙋 I'll build this](https://github.com/blip-ha/blip/issues/new?template=sensor_claim.yml&title=Building%3A%20Thread%2FMatter%20support&sensor=Thread%2FMatter%20support%20%28Issue%20first%29&integration=Thread%2FMatter)** | Whether distance and bands are available over Matter isn't confirmed. |

## Not eligible

| Sensor | Why |
|---|---|
| Aqara FP2 | Home Assistant gets no position data from it. |
| Anything else | Anything that doesn't detect people. |

Something else that detects people? Open a **New sensor proposal** issue.
