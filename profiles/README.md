# Sensor profiles

One JSON file per sensor model. Blip reads these files to find sensors in Home Assistant and to draw their detection area. Adding a sensor that uses an existing mode means adding one file here, with no code changes.

`schema.json` defines the format. Every profile is checked against it in CI; editors such as VS Code also use it for autocomplete.

## Fields

| Field | What it is |
|---|---|
| `id` | Unique id; must equal the file name without `.json`. |
| `name` | Shown in Blip, e.g. `Aqara FP300`. |
| `manufacturer` | Maker's name. |
| `integration` | How the sensor reaches Home Assistant: `zigbee2mqtt`, `zha` or `matter`. |
| `mode` | `band` (distance bands), `cone` (whole cone lights on motion) or `map` (multi-target positions). This version draws `band`. |
| `match.devices` | How Blip recognizes the device in Home Assistant's device registry (**Settings → Devices & services → Devices**). A device matches if every field of any one entry equals its `manufacturer`, `model` or `model_id` (case-insensitive). |
| `entities` | Which of the device's entities does which job. Each role gives the entity `domain`, the end of its entity id (`suffix`) and, for numbers, an optional required `max`. |
| `field_of_view` | Rated `angle_deg` and `range_m`. Blip draws this as the outline. |
| `band` | Band mode: `count` bands of `size_m` meters, and how the `range` entity stores which bands are on. |
| `behavior` | `sleepy`: battery device that queues commands until it wakes. `track_rearm_min`: how often to re-press Track while aiming. `lost_after_s`: seconds without a reading before Blip says it lost you. |

## Roles used by band mode

| Role | Required | Used for |
|---|---|---|
| `range` | Yes | Which bands are on (read and saved) |
| `presence` | Yes | "Someone's here" and lost-you detection |
| `pir` | No | PIR line on the status card |
| `battery` | No | Battery line on the status card |
| `distance` | No | Aim test: which band you're in |
| `track` | No | Aim test: asks the sensor to stream distance |

Without `distance` and `track`, the aim test is unavailable for that sensor.

## If a device isn't matched

If Home Assistant doesn't report a model that a profile matches, Blip falls back to the entity pattern: a device with entities matching a profile's required roles (including the `range` entity's `max`) is treated as that profile.
