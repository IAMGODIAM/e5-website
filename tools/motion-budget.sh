#!/usr/bin/env bash
# tools/motion-budget.sh — pre-ship measurement gate for /services/ motion payload.
# Raw-byte caps (decimal KB, per the war-room budget contract). WARN at >=90%
# of any cap; FAIL on exceedance (exit 1) — the PR does not merge.
# Scope: page-local motion JS only (chrome, Turnstile, gtag, form code, and
# static SVG markup are OUT of scope per the ratified contract).
set -u
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
JSD="$ROOT/public/services/js"

# file-relative-path : raw-byte cap
CAPS=(
  "svc-hero.js:20000"
  "svc-motion.js:4000"
  "svc-board.js:16000"
  "svc-filmbreak.js:10000"
  "svc-figs.js:8000"
)
TOTAL_CAP=77000

fail=0
warn=0
printf '%-16s %10s %10s %10s %8s\n' "asset" "raw" "cap" "gzip(-6)" "status"

check_one() {
  local rel="$1" cap="$2"
  local f="$JSD/$rel"
  if [ ! -f "$f" ]; then
    printf '%-16s %10s %10d %10s %8s\n' "$rel" "MISSING" "$cap" "-" "FAIL"
    fail=1; return
  fi
  local raw gz pct status
  raw=$(wc -c < "$f")
  gz=$(gzip -c -6 "$f" | wc -c)
  pct=$(( raw * 100 / cap ))
  status="ok"
  if [ "$raw" -gt "$cap" ]; then status="FAIL"; fail=1
  elif [ "$pct" -ge 90 ]; then status="WARN"; warn=1; fi
  printf '%-16s %10d %10d %10d %8s\n' "$rel" "$raw" "$cap" "$gz" "$status"
}

for entry in "${CAPS[@]}"; do
  check_one "${entry%%:*}" "${entry##*:}"
done

# svc-reveal.js has no per-file cap but counts toward the page total.
if [ -f "$JSD/svc-reveal.js" ]; then
  raw=$(wc -c < "$JSD/svc-reveal.js"); gz=$(gzip -c -6 "$JSD/svc-reveal.js" | wc -c)
  printf '%-16s %10d %10s %10d %8s\n' "svc-reveal.js" "$raw" "(total)" "$gz" "info"
fi

total_raw=$(cat "$JSD"/svc-hero.js "$JSD"/svc-motion.js "$JSD"/svc-board.js \
  "$JSD"/svc-filmbreak.js "$JSD"/svc-figs.js "$JSD"/svc-reveal.js 2>/dev/null | wc -c)
total_gz=$(cat "$JSD"/svc-hero.js "$JSD"/svc-motion.js "$JSD"/svc-board.js \
  "$JSD"/svc-filmbreak.js "$JSD"/svc-figs.js "$JSD"/svc-reveal.js 2>/dev/null | gzip -c -6 | wc -c)
tpct=$(( total_raw * 100 / TOTAL_CAP ))
tstatus="ok"
if [ "$total_raw" -gt "$TOTAL_CAP" ]; then tstatus="FAIL"; fail=1
elif [ "$tpct" -ge 90 ]; then tstatus="WARN"; warn=1; fi
printf '%-16s %10d %10d %10d %8s\n' "TOTAL" "$total_raw" "$TOTAL_CAP" "$total_gz" "$tstatus"

if [ "$fail" -ne 0 ]; then echo "MOTION BUDGET: FAIL"; exit 1; fi
if [ "$warn" -ne 0 ]; then echo "MOTION BUDGET: WARN (>=90% of a cap)"; exit 0; fi
echo "MOTION BUDGET: PASS"
