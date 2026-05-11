#!/usr/bin/env bash
# Integration test for cdp-verify.py.
# Requires: headless Chrome running on 127.0.0.1:9222, and the influence_ch01
# WASM bundle already served on 127.0.0.1:8767 (per prototypes/option-f setup).
# If neither is up, this test self-skips.
set -u

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
VERIFY="$SCRIPT_DIR/../cdp-verify.py"

# Probe Chrome
if ! curl -sf http://127.0.0.1:9222/json/version >/dev/null; then
  echo "SKIP  Chrome not on 9222 (start with --remote-debugging-port=9222 to run this test)"
  exit 0
fi

# Probe the prototype server
if ! curl -sf http://127.0.0.1:8767/ >/dev/null; then
  echo "SKIP  prototype server not on 8767 (start with python3 -m http.server 8767 in dist-influence-ch01/)"
  exit 0
fi

# Known-good URL: the influence_ch01 prototype passed CDP cleanly during spec work
if python3 "$VERIFY" "http://127.0.0.1:8767/?cb=$(date +%s)" --wait 60 >/tmp/cdp-test.log 2>&1; then
  echo "PASS  influence_ch01 returns exit 0 (no exceptions)"
  exit 0
else
  rc=$?
  echo "FAIL  cdp-verify on known-good page returned $rc"
  tail -20 /tmp/cdp-test.log
  exit 1
fi
