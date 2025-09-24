import { MCPClient } from "./MCPClient";
import { LLMOpenAI } from "./LLMOpenAI";
import { ChatCompletionFunctionTool } from "openai/resources";
import { Tool } from "@modelcontextprotocol/sdk/types.js";

export class Agent {
  private readonly model: string;
  private readonly llm: LLMOpenAI;
  private readonly mcpList: MCPClient[];

  constructor(
    model: string,
    mcpList: MCPClient[],
    systemPrompt?: string,
    userPrompt?: string
  ) {
    this.model = model;
    this.mcpList = mcpList;

    this.llm = new LLMOpenAI();
    if (systemPrompt) {
      this.llm.addMessage({ role: "system", content: systemPrompt });
    }
    if (userPrompt) {
      this.llm.addMessage({ role: "user", content: userPrompt });
    }
  }

  convertOpenAITool(tool: Tool): ChatCompletionFunctionTool {
    return {
      type: "function",
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.inputSchema,
      },
    };
  }

  async invoke() {
    const allTools = this.mcpList
      .map((mcp) => mcp.getTools().map(this.convertOpenAITool))
      .flat();

    let response = await this.llm.chat(this.model, allTools);
    while (true) {
      if (response.toolCalls) {
        for (const toolCall of response.toolCalls) {
          if (toolCall.type === "function") {
            const mcp = this.mcpList.find((mcp) =>
              mcp
                .getTools()
                .find((tool) => tool.name === toolCall.function.name)
            );
            const tool = mcp
              ?.getTools()
              .find((tool) => tool.name === toolCall.function?.name);
            if (tool) {
              const toolRes = await mcp?.invoke(
                tool,
                toolCall.function?.arguments
              );
              if (toolRes?.toolResult) {
                this.llm.addMessage({
                  role: "tool",
                  tool_call_id: toolCall.id!,
                  content: JSON.stringify(toolRes?.toolResult),
                });
              } else {
                this.llm.addMessage({
                  role: "tool",
                  tool_call_id: toolCall.id!,
                  content: "Tool not found",
                });
              }
            }
          }
        }

        response = await this.llm.chat(this.model, allTools);
        continue;
      }

      await this.mcpList.forEach((mcp) => mcp.close());
      return response.streamContent;
    }
  }
}
