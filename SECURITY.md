# Security

## Reporting a vulnerability

Please report security problems **privately**, not in a public issue:

1. Go to the repository's **Security** tab → **Report a vulnerability**
   ([direct link](https://github.com/blip-ha/blip/security/advisories/new)).
2. Describe the problem, how to reproduce it, and what an attacker could do.

You'll get an answer as soon as the maintainer can, and you'll be credited in the fix unless you'd rather not be.

## Scope

Blip runs inside your Home Assistant: a sidebar page, plus a small integration that serves it. Things worth reporting include anything that lets the page or integration act beyond what the signed-in Home Assistant user can already do, leak data outside Home Assistant, or run code from a sensor profile or an issue/pull request.

## Supported versions

Only the latest release gets security fixes.
