# Performance and accessibility budgets

## Release budgets

- LCP <= 2500 ms
- INP <= 200 ms
- CLS <= 0.1
- 60fps target frame budget: 16.67 ms
- Mobile DPR cap: 1.5
- Desktop DPR cap: 2

Synthetic measurements are release indicators, not substitutes for field data.

## Required checks

- Semantic content visible before the cinematic runtime initializes.
- No automatic audio.
- `prefers-reduced-motion` receives the authored static composition.
- A visible motion toggle stores only the user's local preference.
- Keyboard focus and landmarks remain unchanged.
- WebGL/WebGPU failure leaves the page usable.
- Pagehide and context-loss paths release resources.
- Full sitemap returns successful responses and retains vc-nav/vc-foot where applicable.
