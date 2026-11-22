# AntaresGateway

**A local AI gateway and desktop application built on [OmniRoute](https://github.com/cheaper-inference/OmniRoute).** Connect model providers, route requests through a common API, and inspect usage from one dashboard.

This repository contains OmniRoute 3.8.54 with an Electron desktop build named AntaresGateway. Provider availability, supported models, quotas, and pricing depend on the upstream service and your account.

- [Features](#features)
- [Getting started](#getting-started)
- [Connect a client](#connect-a-client)
- [Changes from the previous Antares Gateway](#changes-from-the-previous-antares-gateway)
- [Data and migration](#data-and-migration)
- [Development](#development)
- [Documentation](#documentation)
- [License and credits](#license-and-credits)

## Features

- **Unified API:** OpenAI-compatible chat, Responses and model discovery endpoints, with translation for supported provider formats.
- **Provider connections:** the catalog lists 394 providers; configure supported providers using API keys or OAuth where available. Availability and authentication vary by provider.
- **Routing and resilience:** model combos, fallback, provider circuit breakers, connection cooldowns and model-level lockouts.
- **Usage and operations:** a dashboard for connections, API keys, request logs, usage and costs.
- **Additional capabilities:** embeddings, image generation, speech and transcription endpoints, subject to provider and model support.
- **Agent integrations:** MCP and A2A servers, skills and persistent memory. See the linked guides for setup and supported transports.
- **Deployment options:** Electron desktop builds, a Node.js server and Docker deployment.

## Getting started

### Windows desktop

Build artifacts in `electron/dist-electron/` include a Windows x64 installer and portable executable when produced by the desktop build. Run the installer or portable build from a trusted release of this project. On first launch, complete the application's setup and connect a provider.

The installer name uses `AntaresGateway.Setup.<version>.exe`; the portable build uses `AntaresGateway <version>.exe`. Desktop packaging is configured in [`electron/package.json`](electron/package.json).

### Run from source

Node.js **>=22.22.2 <23 or >=24.0.0 <27** and npm are required. From the repository root:

```bash
npm install
```

The install process creates `.env` from `.env.example` if needed. Before starting the server, configure `JWT_SECRET`, `API_KEY_SECRET`, and `INITIAL_PASSWORD` in `.env`. Use unique random secrets; setting an empty `INITIAL_PASSWORD` allows the onboarding wizard to create the password. The example file documents the settings and secret-generation commands.

```bash
npm run dev
```

Open <http://localhost:20128>, sign in, and add a provider in the dashboard. To stop the development server, press `Ctrl+C` in its terminal. For production deployment, see the [self-hosting guide](docs/getting-started/SELF_HOST_GUIDE.md).

### Windows review launcher

[`Start-AntaresGateway.cmd`](Start-AntaresGateway.cmd) starts the development server on `127.0.0.1:20139` using the separate `_artifacts/antares-review-data` directory. It requires Node.js and installed project dependencies. This is a local review configuration with a fixed initial password defined in its launcher script; use your own credentials and deployment configuration for regular operation. Its initial password applies only when that data directory has no saved password.

## Connect a client

1. In the dashboard, connect an eligible provider and test the connection.
2. Create a gateway API key in the API key manager. Store the key when it is shown.
3. Configure your client with the gateway URL, key, and a model visible to that key:

   ```text
   Base URL: http://localhost:20128/v1
   API key:  YOUR_GATEWAY_KEY
   Model:    YOUR_AVAILABLE_MODEL
   ```

4. Check the model list or make a chat request. Replace both placeholders with values from your installation:

   ```bash
   curl http://localhost:20128/v1/models \
     -H "Authorization: Bearer YOUR_GATEWAY_KEY"

   curl http://localhost:20128/v1/chat/completions \
     -H "Authorization: Bearer YOUR_GATEWAY_KEY" \
     -H "Content-Type: application/json" \
     -d '{"model":"YOUR_AVAILABLE_MODEL","messages":[{"role":"user","content":"Hello!"}]}'
   ```

For the Windows review launcher, use port `20139` instead of `20128`. A client key is distinct from the upstream provider credential. `auto` routing requires an eligible configured target; connecting a provider alone does not guarantee a usable automatic route. See the [quick start](docs/getting-started/QUICK-START.md) and [API reference](docs/reference/API_REFERENCE.md).

## Changes from the previous Antares Gateway

The comparison below uses the locally available **Antares Gateway 3 Windows package** as its baseline: its interface exposes upstream connections, per-client keys, request records, price synchronization, budget reminders and database backup. These are existing capabilities of that package, not claims of new inventions. The new column describes capabilities present in this OmniRoute-based source tree; it does not establish a one-to-one replacement for every old workflow.

| Area | Previous Antares Gateway 3 | Current AntaresGateway / OmniRoute 3.8.54 |
| --- | --- | --- |
| Runtime and delivery | Windows desktop package with a Python 3.12 runtime and WebView interface | Next.js/Node.js gateway and Electron desktop packaging; server and Docker deployment options |
| Upstream connections | Manually configured OpenAI-compatible and Anthropic Messages connections in the interface | Provider catalog and provider-specific integrations, including API-key and supported OAuth connections |
| Routing | The inspected interface exposes upstream configuration; its full routing behavior was not established | Model combos and automatic fallback, with circuit breakers, connection cooldowns and model-specific lockouts |
| API capabilities | The inspected upstream form lists OpenAI-compatible and Anthropic protocols | Chat and Responses APIs plus embeddings, image, audio and other endpoints, depending on configured providers |
| Agent integration | Per-application gateway keys and usage attribution | Gateway keys plus MCP, A2A, skills and memory integrations |
| Usage and costs | Request records, CSV export, OpenRouter price sync, currency conversion and budget reminders | Usage, cost and request-log views; consult the dashboard and documentation for available workflows and settings |
| Data | Local `monitor.sqlite3` under the old application's data directory, with a backup workflow | OmniRoute uses its own SQLite-backed data directory, normally `~/.omniroute/`; the review launcher uses a separate directory |

The previous package's backend source and complete feature matrix were not available for this comparison. Verify any specific workflow against both versions before replacing an existing installation.

## Data and migration

The previous Windows package's cleanup instructions identify `%LOCALAPPDATA%\AntaresGateway` as its default data directory. The current server defaults to `~/.omniroute/`, or the directory specified by `DATA_DIR`. Keep a copy of the old data and credentials before changing installations.

An automatic migration of old connections, client keys, usage records, prices or settings has **not been established**. Treat the versions as separate installations: reconnect providers, create new gateway keys, and verify client requests and usage records before switching production workflows. Keep the old backup until you have verified the replacement.

## Development

```bash
npm run dev                 # Development server
npm run build               # Production build
npm run start               # Start the production server after building
npm run electron:build:win  # Build Windows desktop artifacts
npm run check:docs-all      # Documentation checks
```

The codebase is organized around `src/` (Next.js application and API routes), `open-sse/` (routing, provider execution and translation), `electron/` (desktop application), and `tests/`. See [CONTRIBUTING.md](CONTRIBUTING.md) for development and testing guidance.

## Documentation

- [Quick start](docs/getting-started/QUICK-START.md)
- [Self-hosting guide](docs/getting-started/SELF_HOST_GUIDE.md)
- [API reference](docs/reference/API_REFERENCE.md)
- [Routing and Auto-Combo](docs/routing/AUTO-COMBO.md)
- [Resilience guide](docs/architecture/RESILIENCE_GUIDE.md)
- [MCP server](docs/frameworks/MCP-SERVER.md) · [A2A server](docs/frameworks/A2A-SERVER.md)
- [Electron guide](docs/guides/ELECTRON_GUIDE.md) · [Environment variables](docs/ENVIRONMENT.md)
- [Security](SECURITY.md) · [Contributing](CONTRIBUTING.md) · [Changelog](CHANGELOG.md)

## License and credits

This source tree is distributed under the [MIT License](LICENSE). OmniRoute was created by [Diego Souza](https://github.com/diegosouzapw) and its contributors; see the [upstream project](https://github.com/cheaper-inference/OmniRoute) and [third-party notices](THIRD_PARTY_NOTICES.md).
