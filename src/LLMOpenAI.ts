import OpenAI from 'openai';
import {
  ChatCompletionFunctionTool,
  ChatCompletionMessageParam,
} from 'openai/resources';
import { Logger } from './Logger';

export interface ToolCall {
  type: 'function';
  id: string;
  function: {
    name: string;
    arguments: string;
  };
}

export class LLMOpenAI {
  private readonly client: OpenAI;
  private readonly messages: ChatCompletionMessageParam[];
  private readonly logger: Logger;

  constructor() {
    this.logger = Logger.getInstance('LLM');

    this.client = new OpenAI({
      baseURL: process.env.LLM_MODEL_URL,
      apiKey: process.env.LLM_KEY,
    });
    this.messages = [];

    this.logger.debug('LLM客户端初始化完成');
  }

  addMessage(message: ChatCompletionMessageParam) {
    this.messages.push(message);
    this.logger.debug('添加消息:', message.role);
  }

  async chat(model: string, tools: ChatCompletionFunctionTool[]) {
    this.logger.info('开始LLM对话，模型:', model);
    this.logger.debug('消息数量:', this.messages.length);
    this.logger.debug('工具数量:', tools.length);

    const response = await this.client.chat.completions.create({
      model: model,
      messages: this.messages,
      tools: tools,
      stream: true,
    });

    let streamContent = '';
    const toolCalls: ToolCall[] = [];
    let hasContent = false;
    let hasToolCalls = false;

    for await (const chunk of response) {
      const delta = chunk.choices[0].delta;

      // 普通文本
      if (delta.content) {
        if (!hasContent) {
          this.logger.info('开始接收文本内容');
          hasContent = true;
        }
        streamContent += delta.content;
        process.stdout.write(delta.content);
      }

      // 工具调用
      if (delta.tool_calls) {
        if (!hasToolCalls) {
          this.logger.info('检测到工具调用');
          hasToolCalls = true;
        }

        for (const toolCallChunk of delta.tool_calls) {
          if (toolCalls.length <= toolCallChunk.index) {
            toolCalls.push({
              type: 'function',
              id: '',
              function: { name: '', arguments: '' },
            });
          }

          const currentCall = toolCalls[toolCallChunk.index];
          if (toolCallChunk.id) currentCall.id += toolCallChunk.id;
          if (toolCallChunk.function?.name)
            currentCall.function.name += toolCallChunk.function.name;
          if (toolCallChunk.function?.arguments)
            currentCall.function.arguments += toolCallChunk.function.arguments;

          process.stdout.write(toolCallChunk?.function?.arguments || '');
        }
      }
    }

    this.messages.push({
      role: 'assistant',
      content: streamContent,
      tool_calls: toolCalls.map((toolCall) => ({
        type: 'function',
        id: toolCall.id,
        function: {
          name: toolCall.function.name,
          // OpenAI API 期望此处为字符串，不能提前 JSON.parse
          arguments: toolCall.function.arguments,
        },
      })),
    });

    this.logger.success('LLM对话完成');
    this.logger.debug('响应内容长度:', streamContent.length);
    this.logger.debug('工具调用数量:', toolCalls.length);

    return {
      streamContent,
      toolCalls,
    };
  }
}
