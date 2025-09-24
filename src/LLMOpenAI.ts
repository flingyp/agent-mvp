import OpenAI from "openai";
import {
  ChatCompletionFunctionTool,
  ChatCompletionMessageParam,
} from "openai/resources";

export interface ToolCall {
  type: "function";
  id: string;
  function: {
    name: string;
    arguments: string;
  };
}

export class LLMOpenAI {
  private readonly client: OpenAI;
  private readonly messages: ChatCompletionMessageParam[];

  constructor() {
    this.client = new OpenAI({
      baseURL: process.env.LLM_MODEL_URL,
      apiKey: process.env.LLM_KEY,
    });
    this.messages = [];
  }

  addMessage(message: ChatCompletionMessageParam) {
    this.messages.push(message);
  }

  async chat(model: string, tools: ChatCompletionFunctionTool[]) {
    const response = await this.client.chat.completions.create({
      model: model,
      messages: this.messages,
      tools: tools,
      stream: true,
    });

    let streamContent = "";
    let toolCalls: ToolCall[] = [];
    for await (const chunk of response) {
      const delta = chunk.choices[0].delta;
      if (delta.content) {
        streamContent += delta.content;
        process.stdout.write(delta.content);
      }

      if (delta.tool_calls) {
        for (const toolCallChunk of delta.tool_calls) {
          if (toolCalls.length <= toolCallChunk.index) {
            toolCalls.push({
              type: "function",
              id: "",
              function: { name: "", arguments: "" },
            });
          }
          let currentCall = toolCalls[toolCallChunk.index];
          if (toolCallChunk.id) currentCall.id += toolCallChunk.id;
          if (toolCallChunk.function?.name)
            currentCall.function.name += toolCallChunk.function.name;
          if (toolCallChunk.function?.arguments)
            currentCall.function.arguments += toolCallChunk.function.arguments;

          process.stdout.write(toolCallChunk?.function?.arguments || "");
        }
      }
    }

    this.messages.push({
      role: "assistant",
      content: streamContent,
      tool_calls: toolCalls.map((toolCall) => ({
        type: "function",
        id: toolCall.id,
        function: {
          name: toolCall.function.name,
          // OpenAI API 期望此处为字符串，不能提前 JSON.parse
          arguments: toolCall.function.arguments,
        },
      })),
    });

    return {
      streamContent,
      toolCalls,
    };
  }
}
