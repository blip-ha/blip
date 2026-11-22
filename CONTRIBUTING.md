# Contributing to Blip

Thanks for wanting to help! Blip grows one sensor at a time, built by people who own that sensor and can test it in their own home. If you have one of the sensors under **Help wanted** in [SENSORS.md](SENSORS.md), you're exactly who we're hoping to hear from.

## The rule

> **New sensor on Z2M = add a profile file. ZHA/Matter or any change to discovery/core = open an issue with your approach first and wait for approval.**

That's it. The rest of this page walks you through it.

## How it works

- **A sensor contribution is one new file:** `profiles/<id>.json`. It's data, not code, so it's quick to review and can't affect anyone else's sensors.
- **Everything generated from it is rebuilt for you after merge:** the sensor list in `SENSORS.md`, the issue forms and the panel bundle. That means two people can add two sensors at the same time without stepping on each other. You can run the generators locally to try things out; just leave their output out of your pull request.
- **Bigger changes start with a conversation.** A new mode (Cone, Map, Regions), ZHA or Matter support, or anything in discovery or the core app: open an issue describing your approach first. The maintainer reviews it with you before you write code, which saves everyone time.
- **Not listed yet?** Use the **New sensor proposal** issue form. Blip supports sensors that detect people and give Home Assistant something to draw: distance, zones, positions or a motion cone.

Want to go further, like a new mode or ZHA/Matter support? After your issue is approved, [docs/development.md](docs/development.md) has the code map and a step-by-step for adding a mode.

An automatic check called **Contributor guard** helps pull requests land smoothly: it confirms a sensor pull request adds one profile file and includes the testing details below. If it flags something, the message says what to adjust.

## Adding a sensor

Check [SENSORS.md](SENSORS.md): **What it takes** says whether your sensor is a **profile file** (go ahead) or **issue first**. Check its **Status** badge: 🟢 **open** means it's yours to take. Tap **🙋 I'll build this** on its row; the form opens filled in, so tick the box and submit. The badge then shows your name, so nobody doubles up. Changed your mind? Close the issue and it goes back to open.

1. **Write the profile.** Your sensor's catalog id is your file name. Copy `profiles/aqara_fp300.json` to `profiles/<id>.json` and fill it in; [profiles/README.md](profiles/README.md) explains every field. The `match` rules should name your model, not just its manufacturer.

2. **Check it against your Home Assistant** (no token needed):
   1. In Home Assistant, open **Developer Tools → Template** and paste the contents of [`frontend/scripts/ha-export.jinja`](frontend/scripts/ha-export.jinja).
   2. Change `match` on its first line to part of your sensor's name or model, e.g. `"fp1e"`.
   3. Copy the whole result into a file, e.g. `my-sensor.json`. It contains your device names, so keep it to yourself.
   4. In `frontend/`:

      ```bash
      npm install
      npm run profile:check -- --states my-sensor.json ../profiles/<id>.json
      ```

   It lists each sensor the profile finds and the entity it picked for each job, or tells you what's missing and what to add. You're looking for **matched by device model**.

   Prefer a live check? It needs a long-lived access token (**Profile → Security**), which has full access to your Home Assistant. The checker only reads, and takes the token from an environment variable it never saves. Delete the token afterwards.

   ```bash
   BLIP_HA_TOKEN=<token> npm run profile:check -- --ha http://homeassistant.local:8123 ../profiles/<id>.json
   ```

3. **See how it draws:** `npm run dev`, then open the address it prints with `?profile=<id>` added, e.g. `http://localhost:5173/?profile=aqara_fp1e`. You get Blip with a simulated sensor built from your profile: its fan, bands and aim test.

4. **Run the checks:**

   ```bash
   npm test                # includes the schema check for your profile
   npm run catalog:check   # eligibility and safety checks
   ```

5. **Walk-test on your own Home Assistant.** Run `npm run build`, copy `custom_components/blip` into your `config/custom_components/`, restart, and open Blip. Screen-record your phone with **Aim test** on while you walk away from the sensor and back, so the band lighting up and "lost you" are visible.

6. **Open a pull request with just your profile file**, and fill in the template: your Home Assistant version, your integration (Zigbee2MQTT, ZHA or Matter) and the walk-test recording. Contributor guard checks for those and re-runs when you edit the description.

The checks also catch the common slips: a model that isn't in the catalog yet, a mode or integration that doesn't match it, or `match` rules that would also claim another model's devices.

## Bugs and ideas

Use the **Bug report** issue form. Include your Blip version (bottom of the Blip page) and your Home Assistant version. Found a security problem? Please report it privately; see [SECURITY.md](SECURITY.md).
