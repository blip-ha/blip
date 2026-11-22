#!/usr/bin/env bash
# Contributor guard rules. Run by .github/workflows/contributor-guard.yml from the protected
# base branch (never the pull request's code), and self-tested in CI by test-contributor-guard.sh.
#
#   contributor-guard.sh files < changes.tsv   # lines: "<status>\t<path>" from the GitHub API
#   contributor-guard.sh body                  # reads the pull request text from $PR_BODY
#
# Exit 0 = ready, 1 = needs something. Everything printed starts with two spaces, so nothing a
# contributor puts in a file name or the PR text can become a GitHub workflow command.
set -uo pipefail

check_files() {
  local outside=0 status file
  while IFS=$'\t' read -r status file; do
    [ -z "${status}${file}" ] && continue
    # A contribution adds one new sensor profile. Everything generated from it (SENSORS.md,
    # the issue forms, the panel bundle) is rebuilt automatically after merge, so two sensor
    # pull requests never touch the same file.
    if [[ "$file" =~ ^profiles/[a-z0-9]+(_[a-z0-9]+)*\.json$ && "$file" != "profiles/schema.json" && "$status" == "added" ]]; then
      printf '  ok           %s  %q\n' "$status" "$file"
    else
      printf '  needs review %s  %q\n' "$status" "$file"; outside=1
    fi
  done
  if [ "$outside" = 1 ]; then
    echo "  Thanks for the pull request! Sensor contributions add just one new file in profiles/;"
    echo "  Blip regenerates SENSORS.md, the issue forms and the panel bundle after merge, so"
    echo "  please leave those out. Changes to anything else start with an issue describing your"
    echo "  approach; once the maintainer has reviewed it, they add the maintainer-approved label."
  fi
  return "$outside"
}

check_body() {
  local body="${PR_BODY:-}" missing=0
  if ! grep -Eiq 'Home Assistant version:[[:space:]]*20[0-9]{2}\.[0-9]{1,2}' <<<"$body"; then
    echo "  still needed: your Home Assistant version (e.g. \"Home Assistant version: 2026.11.2\")"; missing=1
  fi
  if ! grep -Eiq '^[[:space:]]*[-*][[:space:]]*\[[xX]\][[:space:]]*(Zigbee2MQTT|ZHA|Matter)' <<<"$body"; then
    echo "  still needed: which integration your sensor uses (tick Zigbee2MQTT, ZHA or Matter)"; missing=1
  fi
  if ! grep -Eiq 'https://github\.com/user-attachments/assets/[A-Za-z0-9-]+|https://[^[:space:])]+\.(mp4|mov|webm)' <<<"$body"; then
    echo "  still needed: your walk-test screen recording (drag the video into the pull request text)"; missing=1
  fi
  [ "$missing" = 0 ] && echo "  Testing details look complete. Thank you!"
  return "$missing"
}

case "${1:-}" in
  files) check_files ;;
  body) check_body ;;
  *) echo "usage: $0 files|body" >&2; exit 2 ;;
esac
