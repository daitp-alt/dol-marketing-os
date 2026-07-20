# DOL Marketing OS — UI Demo

Interactive, responsive UI concept for DOL English's internal Marketing Operating System.

Production base path: `https://mkt.dolenglish.us/seo`. All UI assets and browser API requests are namespaced under `/seo/*` so the existing DOL MKT Search routes remain isolated.

## Included modules

- Multi-project workspace and project switcher
- Marketing overview dashboard
- Content Studio with five AI workflows: Keywords Research, Outline, Writer, Review and Audit
- Expandable Content Tools sidebar with a dedicated route and workspace for each workflow
- Writer canvas with editable system prompt, live OpenRouter model catalog, DOL brand voice, writing style and on-page guardrails
- Secure Content Agent backend using `OPENROUTER_CONTENT_KEY`, plus HTML, Word-compatible DOC and TXT export
- SEO Suite
- Seeding Operations
- Request Center for cross-department collaboration
- Resource Hub
- Blueprints for Paid Ads, Social, Reports and Administration
- OpenRouter AI Gateway with per-category monthly usage and limit monitoring

## OpenRouter gateway

The admin gateway reads live usage from OpenRouter without exposing keys to the browser. Configure these as Vercel environment variables:

```text
AI_GATEWAY_ADMIN_TOKEN
OPENROUTER_MANAGEMENT_KEY
OPENROUTER_CONTENT_KEY
OPENROUTER_SEO_KEY
OPENROUTER_SEEDING_KEY
OPENROUTER_ADS_KEY
OPENROUTER_CHATBOT_KEY
OPENROUTER_RESEARCH_KEY
```

`OPENROUTER_MANAGEMENT_KEY` is sufficient for the usage dashboard because it can list key metadata and account credits. Category keys are used later by their respective generation workflows. API keys submitted through the validation form are never persisted by the application.

## Content Agent

The Content Studio calls `POST /seo/api/content/generate` for all five workflows. Requests require the `AI_GATEWAY_ADMIN_TOKEN` in the `X-Admin-Token` header, while the OpenRouter key stays server-side in `OPENROUTER_CONTENT_KEY`. The model selector is synchronized from OpenRouter `GET /api/v1/models` through the server-side `/seo/api/openrouter/models` endpoint.

AI-generated HTML is sanitized again in the browser before it is inserted into the editable writing canvas. Export is available as clean HTML, plain TXT, or Word-compatible `.doc`.

## Run locally

This demo has no build step or dependencies. Open `index.html` directly, or serve the folder with any static HTTP server.

## Important

Dashboard metrics and operational records are illustrative demo data. Content workflows invoke live AI models only after the required Vercel environment variables have been configured.
