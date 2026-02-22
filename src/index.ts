import {
  AuthenticatedMCPServer,
  withAuth,
  JWTAuthProvider,
  APITokenResolver
} from '@prmichaelsen/mcp-auth';
import { env } from './config/environment.js';

console.log('🚀 Starting ACP MCP server...');
console.log('📋 Configuration:');
console.log(`   - Platform: ${env.PLATFORM_URL}`);
console.log(`   - CORS Origin: ${env.CORS_ORIGIN}`);
console.log(`   - Service Token: ${env.PLATFORM_SERVICE_TOKEN.substring(0, 10)}...`);

// Create authenticated MCP server
const server = new AuthenticatedMCPServer({
  name: 'acp-mcp-server',
  version: '1.0.0',
  
  // JWT authentication provider
  // Uses PLATFORM_SERVICE_TOKEN as the JWT secret (agentbase.me signs JWTs with this)
  authProvider: new JWTAuthProvider({
    jwtSecret: env.PLATFORM_SERVICE_TOKEN,
    userIdClaim: 'userId' // agentbase.me uses 'userId', not 'sub'
  }),
  
  // API-based token resolver for per-user credentials
  tokenResolver: new APITokenResolver({
    tenantManagerUrl: env.PLATFORM_URL,
    serviceToken: env.PLATFORM_SERVICE_TOKEN,
    cacheTokens: true,
    cacheTtl: 300000 // 5 minutes
  }),
  
  resourceType: 'acp-remote-dev',
  
  // Stdio transport for local/remote use
  transport: {
    type: 'stdio'
  }
});

// Register example tool with automatic authentication
server.registerTool(
  'example_tool',
  withAuth(async (args: { message: string }, accessToken: string, userId: string) => {
    // Validate message parameter
    if (typeof args.message !== 'string') {
      throw new Error('Invalid message parameter: must be a string');
    }
    
    if (args.message.length > 10000) {
      throw new Error('Message too long: maximum 10000 characters');
    }
    
    // Process the message with user context
    return JSON.stringify({
      processed: args.message,
      userId: userId,
      timestamp: new Date().toISOString(),
      note: 'This tool has access to per-user credentials via accessToken'
    }, null, 2);
  }),
  {
    description: 'An example tool for ACP remote development',
    inputSchema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          description: 'A message to process'
        }
      },
      required: ['message']
    }
  }
);

// Add more tools here using server.registerTool()
// Each tool wrapped with withAuth() gets automatic:
// - JWT validation
// - Per-user credential fetching
// - User context (userId, accessToken)

// Start server
console.log('\n🔧 Starting server...\n');

server.start()
  .then(() => {
    console.log('✅ ACP MCP server running on stdio');
    console.log('📖 Ready to receive MCP requests\n');
  })
  .catch((error) => {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  });

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down ACP MCP server...');
  await server.stop();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down ACP MCP server...');
  await server.stop();
  process.exit(0);
});
