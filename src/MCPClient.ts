import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { Tool } from "@modelcontextprotocol/sdk/types.js";

export class MCPClient {
  private mcp: Client;
  private tools: Tool[] = [];
  private command: string;
  private args: string[];

  constructor(name: string, version: string, command: string, args: string[]) {
    this.command = command;
    this.args = args;

    this.mcp = new Client({
      name: name,
      version: version,
    });
  }

  async connect() {
    const transport = new StdioClientTransport({
      command: this.command,
      args: this.args,
    });
    await this.mcp.connect(transport);
    const toolsResult = await this.mcp.listTools();
    this.tools = toolsResult.tools;
  }

  async close() {
    await this.mcp.close();
  }

  getTools() {
    return this.tools;
  }

  async invoke(tool: Tool, args: any) {
    const result = await this.mcp.callTool({
      name: tool.name,
      arguments: args,
    });
    return result;
  }
}
