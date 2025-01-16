import Anthropic from "@anthropic-ai/sdk";
import fs from 'fs';

const MCP_INSTRUCTIONS = 
`
Overview of Creating an MCP File

To create a functional Model Context Protocol (MCP) server, follow these key steps:

1. Setup the MCP Server
	•	Use the @modelcontextprotocol/sdk library to create a server instance.
	•	Define the server’s metadata, such as name and version.

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const server = new Server(
  { name: "weather", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

2. Define Available Tools
	•	Use setRequestHandler to define the tools supported by the server.
	•	Each tool should specify:
	•	Name: A unique identifier.
	•	Description: Briefly describe the tool’s functionality.
	•	Input Schema: Specify expected input fields and their types.

Example:

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "get-alerts",
        description: "Get weather alerts for a state",
        inputSchema: {
          type: "object",
          properties: {
            state: {
              type: "string",
              description: "Two-letter state code (e.g., CA, NY)",
            },
          },
          required: ["state"],
        },
      },
      {
        name: "get-forecast",
        description: "Get weather forecast for a location",
        inputSchema: {
          type: "object",
          properties: {
            latitude: { type: "number", description: "Latitude of the location" },
            longitude: { type: "number", description: "Longitude of the location" },
          },
          required: ["latitude", "longitude"],
        },
      },
    ],
  };
});

3. Implement Tool Functionality
	•	Write handlers for each tool to process the inputs and produce results.
	•	For example, use APIs to fetch weather data and return results in the expected format.

The response format must follow this structure:

{
  content: [
    {
      type: "text",
      text: [RESULT],
    },
  ],
}

Example implementation for get-alerts:

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === "get-alerts") {
    const state = args.state.toUpperCase();
    const alertsUrl = \`https://api.weather.gov/alerts?area=\${state}\`;
    const response = await fetch(alertsUrl, { headers: { "User-Agent": "weather-app/1.0" } });
    
    if (!response.ok) {
      return {
        content: [
          {
            type: "text",
            text: "Failed to retrieve alerts data",
          },
        ],
      };
    }

    const data = await response.json();
    const alerts = data.features || [];

    if (alerts.length === 0) {
      return {
        content: [
          {
            type: "text",
            text: \`No active alerts for \${state}\`,
          },
        ],
      };
    }

    const formattedAlerts = alerts.map((alert) => alert.properties.headline).join("\n");
    return {
      content: [
        {
          type: "text",
          text: \`Active alerts for \${state}:\n\${formattedAlerts}\`,
        },
      ],
    };
  }

  throw new Error(\`Unknown tool: \${name}\`);
});

4. Start the Server
	•	Use a transport layer (e.g., StdioServerTransport) to handle communication.
	•	Connect the server and start listening for requests.

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Weather MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});

This process defines a minimal MCP server, ready to support tools with well-defined functionality and input-output handling.
`

export function getMCPInstructions({
    mcpServerDescription,
    allFileContents,
    apiKey
}: {
    mcpServerDescription: string,
    allFileContents: string,
    apiKey: string
}) {
    const anthropic = new Anthropic({
        apiKey
      });

  return `
You are a senior software engineer working on a Model Context Protocol (MCP) server.

The user want to convert their existing project code logic into a functional MCP server. They provided the following files from their existing project:

${allFileContents}

Here is the steps to create a functional MCP server:
\`\`\`
${MCP_INSTRUCTIONS}
\`\`\`

You are working in a starter project that includes the following files:
\`\`\` src/index.ts
${fs.readFileSync('sample-mcp-server/src/index.ts', 'utf8')}
\`\`\`

\`\`\` package.json
${fs.readFileSync('sample-mcp-server/package.json', 'utf8')}
\`\`\`

Output JSON in this format:
\`\`\`
{
  "index.ts": [full contents of index.ts],
  "package.json": [full contents of package.json]
}
\`\`\`

This is the MCP server description: ${mcpServerDescription}.
`
}