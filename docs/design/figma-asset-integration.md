# Figma Asset Integration

This document defines where final Figma assets should land without blocking production builds.

## Asset Paths

| Asset | Target Path |
| --- | --- |
| Wordmark, dark | `frontend/public/assets/brand/logos/logo-wordmark-dark.svg` |
| Wordmark, light | `frontend/public/assets/brand/logos/logo-wordmark-light.svg` |
| App icon 512 | `frontend/public/assets/brand/icons/icon-512.svg` |
| Favicon | `frontend/public/favicon.svg` |
| Splash dark | `frontend/public/assets/brand/splash/splash-dark.svg` |
| Splash light | `frontend/public/assets/brand/splash/splash-light.svg` |
| Loading state | `frontend/public/assets/brand/states/loading.svg` |
| Empty state | `frontend/public/assets/brand/states/empty.svg` |
| Error state | `frontend/public/assets/brand/states/error.svg` |
| Success state | `frontend/public/assets/brand/states/success.svg` |

## Integration Rules

- Do not use random stock art.
- Keep product UI usable when an asset is unavailable.
- Prefer SVG for logos/icons and optimized raster for illustrations.
- Match asset colors to `frontend/src/styles/theme.css` tokens.
- Do not expose internal Figma URLs in production UI.

## Current Status

The frontend has brand asset slots and token-based fallback UI. Final Figma assets can replace the files above without changing routing or backend contracts.
