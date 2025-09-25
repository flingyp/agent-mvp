import { MCPClient } from './MCPClient';
import { LLMOpenAI } from './LLMOpenAI';
import { Logger } from './Logger';
import { ChatCompletionFunctionTool } from 'openai/resources';
import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { jsonrepair } from 'jsonrepair';

export class Agent {
  private readonly model: string;
  private readonly llm: LLMOpenAI;
  private readonly mcpList: MCPClient[];
  private readonly logger: Logger;

  constructor(
    model: string,
    mcpList: MCPClient[],
    systemPrompt?: string,
    userPrompt?: string,
  ) {
    this.logger = Logger.getInstance('Agent');

    this.logger.info('正在初始化 Agent');
    this.logger.info('模型:', model);
    this.logger.info('MCP客户端数量:', mcpList.length);

    this.model = model;
    this.mcpList = mcpList;

    this.llm = new LLMOpenAI();

    if (systemPrompt) {
      this.llm.addMessage({ role: 'system', content: systemPrompt });
      this.logger.debug('已添加系统提示词');
    }
    if (userPrompt) {
      this.llm.addMessage({ role: 'user', content: userPrompt });
      this.logger.debug('已添加用户提示词');
    }

    this.logger.success('Agent初始化完成');
  }

  convertOpenAITool(tool: Tool): ChatCompletionFunctionTool {
    return {
      type: 'function',
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.inputSchema,
      },
    };
  }

  async invoke() {
    this.logger.info('开始执行Agent调用');

    const openAIFunctionTools = this.mcpList
      .map((mcp) => mcp.getTools().map(this.convertOpenAITool))
      .flat();

    this.logger.info('可用工具总数:', openAIFunctionTools.length);
    this.logger.debug(
      '工具列表:',
      openAIFunctionTools.map((tool) => tool.function.name),
    );

    this.logger.info('发起第一次LLM对话');
    let response = await this.llm.chat(this.model, openAIFunctionTools);

    while (true) {
      if (response.toolCalls && response.toolCalls.length > 0) {
        this.logger.info('检测到工具调用，数量:', response.toolCalls.length);

        for (const toolCall of response.toolCalls) {
          if (toolCall.type === 'function') {
            this.logger.toolCall(
              toolCall.function.name,
              toolCall.function.arguments,
            );

            const currentMCPClient = this.mcpList.find((mcp) =>
              mcp
                .getTools()
                .find((tool) => tool.name === toolCall.function.name),
            );
            const currentTool = currentMCPClient
              ?.getTools()
              .find((tool) => tool.name === toolCall.function?.name);

            if (currentTool) {
              this.logger.debug(
                '找到对应的MCP客户端和工具',
                JSON.stringify(currentTool),
              );
              const toolRes = await currentMCPClient?.invoke(
                currentTool,
                JSON.parse(jsonrepair(toolCall.function.arguments)),
              );
              this.logger.debug('工具执行结果:', toolRes);
              if (toolRes?.content) {
                this.llm.addMessage({
                  role: 'tool',
                  tool_call_id: toolCall.id!,
                  content: toolRes?.content[0]?.text,
                });
                this.logger.toolResult(true, toolRes);
              } else {
                this.logger.warning('工具执行失败，返回空结果');
                this.llm.addMessage({
                  role: 'tool',
                  tool_call_id: toolCall.id!,
                  content: 'Tool not found',
                });
                this.logger.toolResult(false);
              }
            } else {
              this.logger.warning('未找到对应的工具:', toolCall.function.name);
            }
          }
        }

        response = await this.llm.chat(this.model, openAIFunctionTools);
        continue;
      }

      await this.mcpList.forEach((mcp) => mcp.close());
      this.logger.success('Agent执行完成');
      return response.streamContent;
    }
  }
}
