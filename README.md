# acp-mcp-server

Support remote machine development using ACP methodology

This MCP server uses [@prmichaelsen/mcp-auth](https://github.com/prmichaelsen/mcp-auth) for authentication and multi-tenancy.

## Server Configuration

- **Type**: Dynamic Server (Per-User Credentials)
- **Auth Provider**: JWT Provider
- **Platform**: https://agentbase.me

## Installation

```bash
npm install
```

## Development

```bash
# Run in development mode with auto-reload
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Type check
npm run type-check
```

## Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Required variables:
- `PLATFORM_URL`: Your platform URL (https://agentbase.me)
- `CORS_ORIGIN`: CORS origin (usually same as platform URL)
- `JWT_SECRET`: JWT secret for token validation
- `PLATFORM_SERVICE_TOKEN`: Service token for platform integration

## Deployment

### Docker

```bash
# Build production image
docker build -f Dockerfile.production -t acp-mcp-server .

# Run container
docker run -p 8080:8080 --env-file .env acp-mcp-server
```

### Google Cloud Run

```bash
# Upload secrets
tsx scripts/upload-secrets.ts

# Deploy via Cloud Build
gcloud builds submit --config cloudbuild.yaml
```

## Architecture

See the following patterns for implementation details:

- [Server Wrapping](https://github.com/prmichaelsen/acp-mcp-auth-server-base/blob/main/agent/patterns/mcp-auth-server-base.server-wrapping.md)
- [Auth Provider (JWT)](https://github.com/prmichaelsen/acp-mcp-auth-server-base/blob/main/agent/patterns/mcp-auth-server-base.auth-provider-jwt.md)
- [Token Resolver](https://github.com/prmichaelsen/acp-mcp-auth-server-base/blob/main/agent/patterns/mcp-auth-server-base.token-resolver.md)
- [Environment Configuration](https://github.com/prmichaelsen/acp-mcp-auth-server-base/blob/main/agent/patterns/mcp-auth-server-base.environment-configuration.md)

## Adding Tools

Edit `src/index.ts` to add your MCP tools. The server is configured for per-user credentials via the `tokenResolver` function.

## Testing Authentication

Generate and test JWT tokens:

```bash
tsx scripts/test-auth.ts [user-id]
```

## License

MIT
