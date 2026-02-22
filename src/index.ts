import { wrapServer, JWTAuthProvider, APITokenResolver } from '@prmichaelsen/mcp-auth';
import { createServer } from '@prmichaelsen/acp-mcp/factory';
import { env } from './config/environment.js';

console.log('🚀 Starting ACP MCP server...');
console.log('📋 Configuration:');
console.log(`   - Platform: ${env.PLATFORM_URL}`);
console.log(`   - CORS Origin: ${env.CORS_ORIGIN}`);
console.log(`   - Service Token: ${env.PLATFORM_SERVICE_TOKEN.substring(0, 10)}...`);

// Server factory function that creates per-user MCP servers
// This is called by mcp-auth for each authenticated user
// Signature: (accessToken: string, userId: string) => Server | Promise<Server>
async function serverFactory(accessToken: string, userId: string) {
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
  console.log(`   - Private Key: ${sshConfig.privateKey.substring(0, 50)}...`);
  
  // Create the acp-mcp server instance with SSH configuration
  const server = await createServer({
    userId,
    ssh: sshConfig,
  });
  
  console.log(`✅ Server created for user: ${userId}`);
  return server;
}

// Wrap the server factory with mcp-auth for multi-tenancy
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

// Start the wrapped server
console.log('\n🔧 Starting wrapped server...\n');

wrappedServer.start()
  .then(() => {
    console.log('✅ ACP MCP server running on stdio');
    console.log('📖 Ready to receive MCP requests');
    console.log('🔐 Multi-tenant mode: Each user gets their own SSH connection\n');
  })
  .catch((error: Error) => {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  });

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down ACP MCP server...');
  await wrappedServer.stop();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down ACP MCP server...');
  await wrappedServer.stop();
  process.exit(0);
});
