import OpenAI from "openai";
import {
  ChatCompletionChunk,
  ChatCompletionFunctionTool,
  ChatCompletionMessageParam,
  ChatCompletionMessageToolCall,
} from "openai/resources";

// interface LLMMessage {
//   role: "user" | "assistant" | "tool" | "developer";
//   content: string;
//   tool_calls?: ChatCompletionChunk.Choice.Delta.ToolCall[];
// }

export class LLMOpenAI {
  private readonly client: OpenAI;
  private readonly messages: ChatCompletionMessageParam[];

  constructor() {
    this.client = new OpenAI({
      baseURL: process.env.OPENAI_BASE_URL,
      apiKey: process.env.OPENAI_API_KEY,
    });
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
    let toolCalls: ChatCompletionMessageToolCall[] = [];
    for await (const chunk of response) {
      const delta = chunk.choices[0].delta;
      if (delta.content) {
        streamContent += delta.content;
        process.stdout.write(delta.content);
      }

      if (delta.tool_calls) {
        delta.tool_calls.forEach((call) => {
          toolCalls.push({
            type: "function",
            id: call.id!,
            function: {
              name: call.function?.name || "",
              arguments: call.function?.arguments || "",
            },
          });
        });
      }
    }

    this.messages.push({
      role: "assistant",
      content: streamContent,
      tool_calls: toolCalls,
    });

    return {
      streamContent,
      toolCalls,
    };
  }
}
