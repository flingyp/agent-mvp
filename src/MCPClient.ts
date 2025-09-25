import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { Tool } from '@modelcontextprotocol/sdk/types.js';

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
    console.log('[MCPClient] 开始连接MCP服务器');
    console.log('[MCPClient] 创建传输层', this.command, this.args);

    const transport = new StdioClientTransport({
      command: this.command,
      args: this.args,
    });

    console.log('[MCPClient] 正在连接...');
    await this.mcp.connect(transport);
    console.log('[MCPClient] 连接成功，获取工具列表');

    const toolsResult = await this.mcp.listTools();
    this.tools = toolsResult.tools;

    console.log('[MCPClient] 获取到工具数量:', this.tools.length);
    console.log(
      '[MCPClient] 工具列表:',
      this.tools.map((tool) => tool.name),
    );
  }

  async close() {
    console.log('[MCPClient] 关闭MCP连接');
    await this.mcp.close();
    console.log('[MCPClient] MCP连接已关闭');
  }

  getTools() {
    console.log('[MCPClient] 获取工具列表，数量:', this.tools.length);
    return this.tools;
  }

  async invoke(tool: Tool, args: any) {
    console.log('[MCPClient] 调用工具:', tool.name);
    console.log('[MCPClient] 工具参数:', args);

    try {
      const result = await this.mcp.callTool({
        name: tool.name,
        arguments: args,
      });

      console.log('[MCPClient] 工具调用成功');
      if (result.content) {
        console.log('[MCPClient] 返回结果类型:', typeof result.content);
      }

      return result;
    } catch (error) {
      console.error('[MCPClient] 工具调用失败:', error);
      throw error;
    }
  }
}
