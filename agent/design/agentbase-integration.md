# agentbase.me Integration Design

**Concept**: Integration design for acp-mcp-server with agentbase.me multi-tenant platform
**Created**: 2026-02-22
**Status**: Implemented
**Version**: 1.0.0

---

## Overview

This document describes how the acp-mcp-server integrates with the agentbase.me multi-tenant platform using `@prmichaelsen/mcp-auth` for authentication and `@prmichaelsen/acp-mcp` for remote machine access via SSH.

## Architecture

### Components

1. **agentbase.me Platform** - Multi-tenant platform that manages users and integrations
2. **mcp-auth Wrapper** - Handles JWT authentication and per-user credential resolution
3. **acp-mcp Server Factory** - Creates per-user MCP server instances with SSH connections
4. **Remote Machines** - User-specific remote machines accessed via SSH

### Data Flow

```
User Request (with JWT)
  ↓
agentbase.me Platform
  ↓
mcp-auth Wrapper
  ├─ Validates JWT (JWTAuthProvider)
  ├─ Extracts userId from JWT
  ├─ Fetches SSH credentials (APITokenResolver)
  └─ Calls serverFactory(accessToken, userId)
      ↓
acp-mcp Server Factory
  ├─ Parses SSH credentials from accessToken
  ├─ Creates SSH connection to remote machine
  └─ Returns configured MCP Server instance
      ↓
MCP Server handles request
  ├─ Executes tools on remote machine via SSH
  └─ Returns response to user
```

## Implementation

### Server Factory Function

The server factory function is the core integration point:

```typescript
async function serverFactory(accessToken: string, userId: string) {
  // Parse SSH credentials from accessToken (JSON string)
  const credentials = JSON.parse(accessToken);
  const sshConfig = {
    host: credentials.ssh_host || credentials.host,
    port: credentials.ssh_port || credentials.port || 22,
    username: credentials.ssh_username || credentials.username,
    privateKey: credentials.ssh_private_key || credentials.privateKey,
  };
  
  // Create acp-mcp server instance with SSH configuration
  const server = await createServer({
    userId,
    ssh: sshConfig,
  });
  
  return server;
}
```

### Wrapper Configuration

The wrapper configuration connects all components:

```typescript
const wrappedServer = wrapServer({
  serverFactory,
  authProvider: new JWTAuthProvider({
    jwtSecret: env.PLATFORM_SERVICE_TOKEN,
    userIdClaim: 'userId', // agentbase.me uses 'userId', not 'sub'
  }),
  tokenResolver: new APITokenResolver({
    tenantManagerUrl: env.PLATFORM_URL,
    serviceToken: env.PLATFORM_SERVICE_TOKEN,
    cacheTokens: true,
    cacheTtl: 300000, // 5 minutes
  }),
  resourceType: 'acp-remote-dev',
  transport: {
    type: 'stdio',
  },
});
```

## agentbase.me Configuration

### Integration Setup

Users must configure the following in their agentbase.me integration settings:

**Integration ID**: `acp-remote-dev`

**Credentials Schema**:
```json
{
  "ssh_host": "remote.example.com",
  "ssh_port": 22,
  "ssh_username": "user",
  "ssh_private_key": "-----BEGIN OPENSSH PRIVATE KEY-----\n..."
}
```

### API Endpoint

The server fetches credentials from:
```
GET {PLATFORM_URL}/api/v1/integrations/acp-remote-dev/credentials
Authorization: Bearer {JWT}
```

**Response Format**:
```json
{
  "credentials": {
    "ssh_host": "remote.example.com",
    "ssh_port": 22,
    "ssh_username": "user",
    "ssh_private_key": "-----BEGIN OPENSSH PRIVATE KEY-----\n..."
  }
}
```

## Security Considerations

### JWT Validation

- JWTs are signed with `PLATFORM_SERVICE_TOKEN`
- Token expiration is enforced
- User ID is extracted from `userId` claim (not `sub`)

### SSH Credentials

- Private keys are stored securely in agentbase.me
- Credentials are fetched per-request (ephemeral mode)
- Credentials are cached for 5 minutes to reduce API calls
- SSH connections are isolated per user

### Multi-Tenancy

- Each user gets their own MCP server instance
- SSH connections are not shared between users
- Ephemeral mode ensures no state leakage between requests

## Environment Variables

Required environment variables:

```bash
# Platform Integration
PLATFORM_URL=https://agentbase.me
PLATFORM_SERVICE_TOKEN=your-service-token-here

# CORS Configuration
CORS_ORIGIN=https://agentbase.me

# Server Configuration
PORT=8080
NODE_ENV=production
```

## Testing

### Local Testing

1. Set up `.env` file with platform credentials
2. Configure test user credentials in agentbase.me
3. Generate test JWT with `userId` claim
4. Run server: `npm run dev`
5. Send MCP request with JWT in Authorization header

### Integration Testing

1. Deploy server to Cloud Run
2. Configure agentbase.me to use deployed server URL
3. Test with real user accounts
4. Verify SSH connections work correctly
5. Check logs for authentication and connection issues

## Deployment

### Cloud Run Deployment

The server is deployed to Google Cloud Run with:

- **Service Name**: `acp-mcp-server`
- **Region**: `us-central1`
- **Min Instances**: 0 (scale to zero)
- **Max Instances**: 10
- **Memory**: 512Mi
- **CPU**: 1
- **Timeout**: 60s
- **Allow Unauthenticated**: true (JWT validation handled by mcp-auth)

### Secrets Management

Secrets are stored in Google Cloud Secret Manager:

- `acp-mcp-server-platform-token`: Platform service token
- Additional secrets as needed

## Monitoring

### Logs

Key log messages to monitor:

- `📦 Creating server instance for user: {userId}` - Server creation
- `🔐 SSH Config for {userId}` - SSH configuration
- `✅ Server created for user: {userId}` - Successful creation
- `❌ Failed to start server` - Errors

### Metrics

Monitor:

- Request latency
- SSH connection failures
- Authentication failures
- Credential fetch timeouts
- Server creation errors

## Troubleshooting

### Common Issues

**Issue**: "Failed to fetch credentials"
- **Cause**: Invalid JWT or expired token
- **Solution**: Verify JWT is valid and not expired

**Issue**: "Invalid SSH credentials: missing required fields"
- **Cause**: Incomplete credentials in agentbase.me
- **Solution**: Ensure all SSH fields are configured

**Issue**: "SSH connection timeout"
- **Cause**: Remote machine unreachable or firewall blocking
- **Solution**: Verify remote machine is accessible and SSH port is open

**Issue**: "Credentials fetch timeout after 10 seconds"
- **Cause**: agentbase.me API slow or unavailable
- **Solution**: Check platform status, increase timeout if needed

## Future Enhancements

- [ ] Support for SSH key passphrase
- [ ] Support for SSH agent forwarding
- [ ] Connection pooling for SSH connections
- [ ] Metrics dashboard for monitoring
- [ ] Rate limiting per user
- [ ] Automatic retry on SSH connection failures

---

**Status**: Implemented
**Last Updated**: 2026-02-22
**Related Documents**:
- [requirements.md](requirements.md)
- [mcp-auth-server-base.server-wrapping.md](../patterns/mcp-auth-server-base.server-wrapping.md)
- [mcp-auth-server-base.token-resolver.md](../patterns/mcp-auth-server-base.token-resolver.md)
