#!/usr/bin/env node

/**
 * ACP MCP Server - Multi-tenant wrapper with Platform JWT auth
 *
 * This server wraps acp-mcp with authentication and multi-tenancy support.
 */

import { wrapServer } from '@prmichaelsen/mcp-auth';
import { createServer } from '@prmichaelsen/acp-mcp/factory';
import { env } from './config/environment.js';
import { PlatformJWTProvider } from './auth/platform-jwt-provider.js';
import { PlatformTokenResolver } from './auth/platform-token-resolver.js';

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

// Create auth provider
const authProvider = new PlatformJWTProvider({
  serviceToken: config.platform.serviceToken,
  issuer: 'agentbase.me',
  audience: 'mcp-server',
  userIdClaim: 'userId',
  cacheResults: true,
  cacheTtl: 60000 // 60 seconds
});

// Create token resolver
const tokenResolver = new PlatformTokenResolver({
  platformUrl: config.platform.url,
  authProvider,
  cacheTokens: true,
  cacheTtl: 300000 // 5 minutes
});

// Wrap server with authentication
const wrappedServer = wrapServer({
  serverFactory: async (accessToken: string, userId: string) => {
    console.log(`📦 Creating server instance for user: ${userId}`);
    
    // Parse credentials from JSON string
    // The token resolver returns the full credentials object as JSON
    let credentials;
    try {
      credentials = JSON.parse(accessToken);
    } catch (error) {
      throw new Error(`Failed to parse credentials: ${error instanceof Error ? error.message : 'Invalid JSON'}`);
    }
    
    // Extract SSH configuration from credentials
    // API returns: { access_token: "SSH_KEY", remote_url: "host:port", system_username: "username" }
    
    // Parse host and port from remote_url (might be "host:port" or just "host")
    let host = credentials.remote_url;
    let port = 22;
    if (host && host.includes(':')) {
      const parts = host.split(':');
      host = parts[0];
      port = parseInt(parts[1]) || 22;
    }
    
    // Extract private key from credentials
    // The access_token field should contain the SSH private key in proper PEM format
    const privateKey = credentials.access_token;
    
    const sshConfig = {
      host,
      port,
      username: credentials.system_username,
      privateKey,
    };
    
    // Validate required fields
    if (!sshConfig.host || !sshConfig.username || !sshConfig.privateKey) {
      throw new Error(`Invalid SSH credentials: missing required fields (host: ${!!sshConfig.host}, username: ${!!sshConfig.username}, privateKey: ${!!sshConfig.privateKey})`);
    }
    
    console.log(`🔐 SSH Config for ${userId}:`);
    console.log(`   - Host: ${sshConfig.host}`);
    console.log(`   - Port: ${sshConfig.port}`);
    console.log(`   - Username: ${sshConfig.username}`);
    console.log(`   - Private Key: ${sshConfig.privateKey.substring(0, 50)}...`);
    
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
  authProvider,
  tokenResolver,
  resourceType: 'acp',
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
