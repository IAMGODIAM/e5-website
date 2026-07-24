# Cinematic QA policy

A release is blocked when a canonical route fails HTTP/semantic chassis checks, when the homepage has serious/critical axe violations introduced by the change, when reduced motion still creates the GPU canvas, or when context loss removes semantic content.

Three aspect ratios are captured on every cinematic change:

- 1440×810 (16:9)
- 430×764 (9:16)
- 900×900 (1:1)

Initial captures are marked `new`. Existing GoldenFrame baselines cannot be replaced automatically. An approved EventLog milestone must name the approver, composition, route, and aspect ratio before replacement.

Synthetic LCP/INP/CLS readings are indicators. Field telemetry remains authoritative after release.
