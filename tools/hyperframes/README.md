# Isolated HyperFrames renderer

HyperFrames is intentionally excluded from the production website dependency graph because its renderer requires Node 22.12+ and currently carries transitive packages that must not enter the Cloudflare Pages build. Build and run it only through the pinned container:

```bash
npm run render:cinematic
```

The container reads `public/compositions/e5-genesis.html` and writes to `artifacts/`.
