#!/usr/bin/env bash
# Self-test for contributor-guard.sh: every rule, allowed and blocked. Run in CI on every PR.
set -uo pipefail
G="$(dirname "$0")/contributor-guard.sh"
fail=0
files() { # expected-exit  name  "status<TAB>path" ...
  local want=$1 name=$2; shift 2
  printf '%s\n' "$@" | sed 's/ /\t/' | bash "$G" files >/dev/null; local got=$?
  if [ "$got" = "$want" ]; then echo "ok    files: $name"; else echo "FAIL  files: $name (exit $got, wanted $want)"; fail=1; fi
}
body() { # expected-exit  name  body
  PR_BODY="$3" bash "$G" body >/dev/null; local got=$?
  if [ "$got" = "$1" ]; then echo "ok    body:  $2"; else echo "FAIL  body:  $2 (exit $got, wanted $1)"; fail=1; fi
}

files 0 "one new profile" "added profiles/aqara_fp1e.json"
files 0 "two new profiles" "added profiles/aqara_fp1e.json" "added profiles/aqara_fp310.json"
files 1 "new profile + regenerated SENSORS.md" "added profiles/aqara_fp1e.json" "modified SENSORS.md"
files 1 "new profile + rebuilt bundle" "added profiles/aqara_fp1e.json" "modified custom_components/blip/frontend/blip-panel.js"
files 1 "new profile + regenerated forms" "added profiles/aqara_fp1e.json" "modified .github/ISSUE_TEMPLATE/sensor_request.yml"
files 1 "edits the FP300 profile" "modified profiles/aqara_fp300.json"
files 1 "edits the schema" "modified profiles/schema.json"
files 1 "adds a schema-named file" "added profiles/schema.json"
files 1 "edits app code" "added profiles/aqara_fp1e.json" "modified frontend/src/panel.ts"
files 1 "edits discovery" "modified frontend/src/discovery.ts"
files 1 "edits CI" "modified .github/workflows/ci.yml"
files 1 "edits the guard" "modified .github/scripts/contributor-guard.sh"
files 1 "edits the catalog" "modified catalog/sensors.json"
files 1 "deletes the FP300 profile" "removed profiles/aqara_fp300.json"
files 1 "profile in a subfolder" "added profiles/x/evil.json"
files 1 "bad profile name" "added profiles/Evil-Name.json"
files 1 "renames a profile" "renamed profiles/aqara_fp1e.json"
files 1 "adds Python to the integration" "added custom_components/blip/evil.py"
files 1 "adds a new issue form" "added .github/ISSUE_TEMPLATE/other.yml"

GOOD='Home Assistant version: 2026.11.2
- [x] Zigbee2MQTT
- [ ] ZHA
- [ ] Matter
Walk-test recording: https://github.com/user-attachments/assets/1a2b3c4d-0000-1111-2222-333344445555'
body 0 "complete" "$GOOD"
body 0 "ZHA ticked, .mp4 link" "Home Assistant version: 2025.1.4
* [X] ZHA
https://example.com/walk.mp4"
body 1 "empty" ""
body 1 "no version" "${GOOD//Home Assistant version: 2026.11.2/Home Assistant version:}"
body 1 "nothing ticked" "${GOOD//- \[x\] Zigbee2MQTT/- [ ] Zigbee2MQTT}"
body 1 "no recording" "${GOOD//https:\/\/github.com\/user-attachments\/assets\/1a2b3c4d-0000-1111-2222-333344445555/(will add later)}"
body 1 "image instead of video" "${GOOD//https:\/\/github.com\/user-attachments\/assets\/1a2b3c4d-0000-1111-2222-333344445555/https:\/\/example.com\/shot.png}"

body 1 "the template left as is" "$(cat "$(dirname "$0")/../pull_request_template.md")"

exit "$fail"
