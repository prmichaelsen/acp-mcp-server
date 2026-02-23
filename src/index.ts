#!/usr/bin/env node

/**
 * ACP MCP Server - Multi-tenant wrapper with Platform JWT auth
 *
 * This server wraps acp-mcp with authentication and multi-tenancy support.
 */

import { wrapServer, JWTAuthProvider, APITokenResolver } from '@prmichaelsen/mcp-auth';
import { createServer } from '@prmichaelsen/acp-mcp/factory';
import { env } from './config/environment.js';

// Configuration
const config = {
  platform: {
    url: env.PLATFORM_URL,
    serviceToken: env.PLATFORM_SERVICE_TOKEN
  },
  server: {
    port: parseInt(env.PORT)
  }
};

// Validate required configuration
if (!config.platform.serviceToken) {
  console.error('Error: PLATFORM_SERVICE_TOKEN environment variable is required');
  process.exit(1);
}

if (!config.platform.url) {
  console.error('Error: PLATFORM_URL environment variable is required');
  process.exit(1);
}

// Wrap server with authentication
const wrappedServer = wrapServer({
  serverFactory: async (accessToken: string, userId: string) => {
    console.log(`📦 Creating server instance for user: ${userId}`);
    
    // Parse SSH credentials from the access token (JSON string)
    // agentbase.me stores SSH credentials as JSON in the access_token field
    let sshConfig;
    try {
      const credentials = JSON.parse(accessToken);
      sshConfig = {
        host: credentials.ssh_host || credentials.host,
        port: credentials.ssh_port || credentials.port || 22,
        username: credentials.ssh_username || credentials.username,
        privateKey: credentials.ssh_private_key || credentials.privateKey,
      };
    } catch (error) {
      throw new Error(`Failed to parse SSH credentials: ${error instanceof Error ? error.message : 'Invalid JSON'}`);
    }
    
    // Validate SSH configuration
    if (!sshConfig.host || !sshConfig.username || !sshConfig.privateKey) {
      throw new Error('Invalid SSH credentials: missing required fields (host, username, privateKey)');
    }
    
    console.log(`🔐 SSH Config for ${userId}:`);
    console.log(`   - Host: ${sshConfig.host}`);
    console.log(`   - Port: ${sshConfig.port}`);
    console.log(`   - Username: ${sshConfig.username}`);
    
    // Create the acp-mcp server instance with SSH configuration
    const server = await createServer({
      userId,
      ssh: sshConfig,
    });
    
    console.log(`✅ Server created for user: ${userId}`);
    return server;
  },
  authProvider: new JWTAuthProvider({
    jwtSecret: config.platform.serviceToken,
    userIdClaim: 'userId', // agentbase.me uses 'userId', not 'sub'
  }),
  tokenResolver: new APITokenResolver({
    tenantManagerUrl: config.platform.url,
    serviceToken: config.platform.serviceToken,
    cacheTokens: true,
    cacheTtl: 300000, // 5 minutes
  }),
  resourceType: 'acp-remote-dev',
  transport: {
    type: 'sse',
    port: config.server.port,
    host: '0.0.0.0',
    basePath: '/mcp',
    cors: true,
    corsOrigin: env.CORS_ORIGIN
  },
  middleware: {
    rateLimit: {
      enabled: true,
      maxRequests: 100,
      windowMs: 60 * 60 * 1000 // 1 hour
    },
    logging: {
      enabled: true,
      level: 'info'
    }
  }
});

// Start server
async function main() {
  try {
    await wrappedServer.start();
    console.log(`✅ ACP MCP Server started successfully`);
    console.log(`📡 Listening on port ${config.server.port}`);
    console.log(`🔗 Endpoint: http://0.0.0.0:${config.server.port}/mcp`);
    console.log(`🏥 Health check: http://0.0.0.0:${config.server.port}/mcp/health`);
    console.log(`🔐 Authentication: Platform JWT (agentbase.me)`);
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await wrappedServer.stop();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await wrappedServer.stop();
  process.exit(0);
});

// Start the server
main();
