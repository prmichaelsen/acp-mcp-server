import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { wrapServer } from '@prmichaelsen/mcp-auth';
import { jwtAuthProvider } from './auth/provider.js';
import { tokenResolver } from './auth/token-resolver.js';
import { env } from './config/environment.js';

// Create MCP server
const server = new Server(
  {
    name: 'acp-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Add your MCP tools here
server.setRequestHandler('tools/list', async () => {
  return {
    tools: [
      {
        name: 'example_tool',
        description: 'An example tool for ACP remote development',
        inputSchema: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              description: 'A message to process',
            },
          },
          required: ['message'],
        },
      },
    ],
  };
});

server.setRequestHandler('tools/call', async (request) => {
  const { name, arguments: args } = request.params;
  
  if (name === 'example_tool') {
    return {
      content: [
        {
          type: 'text',
          text: `Processed: ${args.message}`,
        },
      ],
    };
  }
  
  throw new Error(`Unknown tool: ${name}`);
});

// Wrap server with auth
const wrappedServer = wrapServer(server, {
  authProvider: jwtAuthProvider,
  tokenResolver,
  corsOrigin: env.CORS_ORIGIN,
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await wrappedServer.connect(transport);
  console.error('acp-mcp-server MCP server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
