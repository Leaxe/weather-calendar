# ICS Proxy: How We Got Here

## The Problem

We wanted to host the weather calendar on GitHub Pages (static hosting). Everything works except calendar URL import — fetching a remote `.ics` file from the browser fails because most calendar servers don't include `Access-Control-Allow-Origin` headers in their responses, so the browser blocks the response before our JavaScript can read it.

During development this isn't an issue because the Vite dev server has a custom middleware plugin (`icsProxyPlugin` in `vite.config.ts`) that proxies the request server-side, where CORS doesn't apply. But GitHub Pages is just static files — there's no server to proxy through.

## Alternatives We Considered

### Google Calendar JSON API
Google offers a REST API with proper CORS headers, so the browser can call it directly. But:
- Requires a Google Cloud project and API key (even for public calendars)
- Private calendars need OAuth, which means a Google sign-in flow, consent screen, and token management
- Google classifies `calendar.readonly` as a "restricted" scope, making app verification slow and bureaucratic
- Only works for Google Calendar — other providers (Outlook, Apple) would still need ICS

We decided this was too much complexity and vendor lock-in for what we need.

### Public CORS Proxies
Services like `corsproxy.io` exist and require zero setup. But you're trusting a third party with your users' calendar URLs, and these services can go down or disappear without notice. Not reliable enough for production.

### Self-Hosted Server
A VPS running a reverse proxy. Most overhead, least justification for a simple static site.

## The Solution: Cloudflare Worker

A Cloudflare Worker is essentially a tiny serverless function that runs on Cloudflare's edge network. It:
- Takes a `?url=` parameter, fetches the remote ICS URL server-side, and returns the response with CORS headers
- Is ~30 lines of code
- Deploys in seconds with `wrangler deploy`
- Free tier allows 100k requests/day
- Lives in the `ics-proxy/` subdirectory as a self-contained sub-project

The app uses a `VITE_ICS_PROXY_URL` environment variable so that:
- In development: points to `/ics-proxy` (the existing Vite middleware, unchanged)
- In production: points to `https://ics-proxy.weather-calendar.workers.dev`

The Vite dev server proxy was kept as-is for local development convenience.
