# AntaresGateway

**A local AI gateway for connecting applications, managing providers, and monitoring model usage.**

AntaresGateway 5.1.0 continues the AntaresGateway 4 product line with a new gateway architecture, broader model integrations, and expanded routing capabilities. Connect your AI applications to a single endpoint and manage their upstream services from a dashboard.

> **Version note:** 5.1.0 is the starting version for the new application release line. The current source and desktop package metadata still report 3.8.54; update and verify the build metadata before publishing a 5.1.0 release.

- [Features](#features)
- [Getting started](#getting-started)
- [Connect an application](#connect-an-application)
- [What's changed since version 4](#whats-changed-since-version-4)
- [Upgrading and data](#upgrading-and-data)
- [Development](#development)
- [License](#license)

## Features

- **One gateway endpoint:** connect compatible applications through a shared API, with request and response translation for supported providers.
- **Provider connections:** the catalog lists 394 providers, with API key or OAuth authentication where supported. Available models and quotas depend on the provider and account.
- **Model routing:** configure model combinations and fallbacks, with provider circuit breakers, connection cooldowns, and model-specific lockouts.
- **Usage dashboard:** manage connections and gateway keys, inspect request logs, and review usage and costs.
- **More API capabilities:** chat, Responses, embeddings, image generation, speech, and transcription, depending on the selected provider and model.
- **Agent integrations:** MCP and A2A servers, skills, and persistent memory.
- **Flexible deployment:** Windows desktop packaging alongside Node.js server and Docker deployment options.

## Getting started

### Windows desktop

Download a Windows x64 installer or portable package from this project's GitHub Releases when available. Run the package, complete the initial setup, and connect a provider through the dashboard.

The desktop build configuration produces an installer and a portable executable in `electron/dist-electron/`. Package filenames use the version recorded in the build metadata.

### Run from source

Requirements: Node.js **>=22.22.2 <23 or >=24.0.0 <27** and npm.

From the project directory:

```bash
npm install
```

The installation process creates `.env` from `.env.example` when needed. Configure unique random values for `JWT_SECRET` and `API_KEY_SECRET` in `.env`. Set your own `INITIAL_PASSWORD`, or leave it empty to create a password through the onboarding wizard. See [`.env.example`](.env.example) for the configuration details.

```bash
npm run dev
```

Open <http://localhost:20128>, sign in, and connect an available provider. Press `Ctrl+C` in the terminal to stop the development server.

### Local review launcher

On Windows, [`Start-AntaresGateway.cmd`](Start-AntaresGateway.cmd) starts a development review instance on <http://127.0.0.1:20139/login>. Install Node.js and project dependencies first. This launcher uses a separate review data directory and a fixed initial password defined in its script; the initial password applies only when that directory has no saved password.

## Connect an application

1. Add a provider and test its connection in the dashboard.
2. Create a gateway API key and save it when displayed. This key is separate from the upstream provider credential.
3. Configure the application with your gateway address and an available model:

   ```text
   Base URL: http://localhost:20128/v1
   API key:  YOUR_GATEWAY_KEY
   Model:    YOUR_AVAILABLE_MODEL
   ```

4. Verify the connection. Replace the placeholders with your own gateway key and an available model ID:

   ```bash
   curl http://localhost:20128/v1/models \
     -H "Authorization: Bearer YOUR_GATEWAY_KEY"

   curl http://localhost:20128/v1/chat/completions \
     -H "Authorization: Bearer YOUR_GATEWAY_KEY" \
     -H "Content-Type: application/json" \
     -d '{"model":"YOUR_AVAILABLE_MODEL","messages":[{"role":"user","content":"Hello!"}]}'
   ```

For the review launcher, use port `20139`. The `auto` model requires an eligible configured route; available routes depend on your provider connections and settings.

## What's changed since version 4

This comparison uses the AntaresGateway 4 Windows package's visible interface and upgrade instructions as the baseline. Its interface already included provider connections, application-specific keys, usage records, model prices, budget reminders, and local database backups.

| Area | AntaresGateway 4 | AntaresGateway 5.1.0 release line |
| --- | --- | --- |
| Application architecture | Windows package with a local desktop interface and Python runtime | Node.js gateway and Electron desktop packaging, with server deployment options |
| Provider connections | Manual OpenAI-compatible and Anthropic Messages connections | Provider catalog with provider-specific integrations, API keys and supported OAuth connections |
| Routing and availability | The visible interface manages upstream connections | Model combinations and fallback, plus circuit breakers, connection cooldowns and model lockouts |
| API surface | The upstream form lists OpenAI-compatible and Anthropic protocols | Chat and Responses plus embeddings, image and audio endpoints, subject to provider support |
| Agent capabilities | Application keys and per-application usage tracking | Gateway keys plus MCP, A2A, skills and memory integrations |
| Usage and cost | Request history, CSV export, model price sync, currency conversion and budget reminders | Usage and cost dashboards and request logs; individual version 4 workflows should be verified separately |
| Data | Local database under the previous Windows application data directory | A separate SQLite-backed data directory, configurable with `DATA_DIR` |

The previous package's complete backend behavior was not available for comparison. Verify the workflows important to your installation before switching versions.

## Upgrading and data

1. Back up the AntaresGateway 4 data directory, typically `%LOCALAPPDATA%\AntaresGateway`, and keep its credentials and database backup in a protected location.
2. Install the new application separately and configure its provider connections and gateway keys.
3. Test your clients, model selection, request logs and usage reporting before switching existing workflows.
4. Keep the old backup until you have verified the replacement.

Automatic migration of version 4 connections, keys, usage records, pricing and settings has not been verified. The review launcher uses `_artifacts/antares-review-data`, separate from normal server data.

## Development

```bash
npm run dev                 # Start the development server
npm run build               # Build the production server
npm run start               # Start the built server
npm run electron:build:win  # Build Windows desktop packages
npm run check:docs-all      # Run documentation checks
```

The project contains the web application and API routes in `src/`, the request and routing engine in `open-sse/`, the desktop application in `electron/`, and tests in `tests/`.

## License

See [LICENSE](LICENSE) and [third-party notices](THIRD_PARTY_NOTICES.md) for the applicable license and attribution information.
