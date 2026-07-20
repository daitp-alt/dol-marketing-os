# DOL Marketing OS — UI Demo

Interactive, responsive UI concept for DOL English's internal Marketing Operating System.

## Included modules

- Multi-project workspace and project switcher
- Marketing overview dashboard
- Content Studio with prompt, brand voice, model and context layers
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

## Run locally

This demo has no build step or dependencies. Open `index.html` directly, or serve the folder with any static HTTP server.

## Important

All metrics and operational records are illustrative demo data. The UI does not connect to production DOL systems, invoke AI models, or mutate external data.
