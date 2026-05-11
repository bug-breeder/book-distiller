#!/usr/bin/env bash
# Test the static-checks.sh against fixtures and the three working prototypes.
set -u

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SKILL_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
REPO_ROOT="$(cd "$SKILL_DIR/../../.." && pwd)"
CHECK="$SKILL_DIR/static-checks.sh"
FIX="$SKILL_DIR/test-fixtures"

fail=0
assert_pass () {
  local label="$1" file="$2"
  if bash "$CHECK" "$file" >/dev/null 2>&1; then
    echo "PASS  $label"
  else
    echo "FAIL  $label (expected exit 0, got $?)"; fail=1
  fi
}
assert_fail () {
  local label="$1" file="$2"
  if bash "$CHECK" "$file" >/dev/null 2>&1; then
    echo "FAIL  $label (expected non-zero, got 0)"; fail=1
  else
    echo "PASS  $label"
  fi
}

assert_pass "good fixture"                     "$FIX/good.py"
assert_fail "R3 underscored cross-cell return" "$FIX/bad-r3-underscore-cross-cell.py"
assert_fail "R4 same-cell .value access"       "$FIX/bad-r4-samecell-value.py"
assert_fail "R1 forbidden scipy import"        "$FIX/bad-r1-scipy.py"
assert_fail "R5 tuple-expression return"       "$FIX/bad-r5-tuple-return.py"
assert_pass "prototype networks_ch02.py"       "$REPO_ROOT/prototypes/option-f/networks_ch02.py"
assert_pass "prototype networks_ch03.py"       "$REPO_ROOT/prototypes/option-f/networks_ch03.py"
assert_pass "prototype influence_ch01.py"      "$REPO_ROOT/prototypes/option-f/influence_ch01.py"

exit $fail
