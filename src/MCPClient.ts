import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { Logger } from './Logger';

export class MCPClient {
  private mcp: Client;
  private tools: Tool[] = [];
  private command: string;
  private args: string[];
  private readonly logger: Logger;
  private readonly name: string;

  constructor(name: string, version: string, command: string, args: string[]) {
    this.name = name;
    this.logger = Logger.getInstance(`MCP-${name}`);

    this.command = command;
    this.args = args;

    this.mcp = new Client({
      name: name,
      version: version,
    });

    this.logger.debug('MCP客户端创建完成，命令:', command, '参数:', args);
  }

  async connect() {
    this.logger.info('开始连接MCP服务器');
    this.logger.debug('创建传输层', this.command, this.args);

    const transport = new StdioClientTransport({
      command: this.command,
      args: this.args,
    });

    this.logger.info('正在连接...');
    await this.mcp.connect(transport);
    this.logger.success('连接成功，获取工具列表');

    const toolsResult = await this.mcp.listTools();
    this.tools = toolsResult.tools;

    this.logger.success('获取到工具数量:', this.tools.length);
    this.logger.debug(
      '工具列表:',
      this.tools.map((tool) => tool.name),
    );
  }

  async close() {
    this.logger.info('关闭MCP连接');
    await this.mcp.close();
    this.logger.success('MCP连接已关闭');
  }

  getTools() {
    this.logger.debug('获取工具列表，数量:', this.tools.length);
    return this.tools;
  }

  async invoke(tool: Tool, args: Record<string, unknown>) {
    this.logger.toolCall(tool.name, args);

    try {
      const result = await this.mcp.callTool({
        name: tool.name,
        arguments: args,
      });

      this.logger.toolResult(true);
      if (result.content) {
        this.logger.debug('返回结果类型:', typeof result.content);
      }

      return result;
    } catch (error) {
      this.logger.toolResult(false, error);
      throw error;
    }
  }
}
