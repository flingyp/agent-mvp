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
    console.log("[Agent] 正在初始化 Agent");
    console.log("[Agent] 模型:", model);
    console.log("[Agent] MCP客户端数量:", mcpList.length);

    this.model = model;
    this.mcpList = mcpList;

    this.llm = new LLMOpenAI();
    if (systemPrompt) {
      this.llm.addMessage({ role: "system", content: systemPrompt });
    }
    if (userPrompt) {
      this.llm.addMessage({ role: "user", content: userPrompt });
    }

    console.log("[Agent] Agent初始化完成");
  }

  private safeParseToolArguments(rawArguments: string): any {
    try {
      return JSON.parse(rawArguments);
    } catch (firstError) {
      // 修复常见问题：未转义的换行符/回车符导致字符串未闭合
      const repaired = rawArguments
        .replace(/\r\n?/g, "\n")
        .replace(/\n/g, "\\n");
      try {
        return JSON.parse(repaired);
      } catch (secondError) {
        console.error("[Agent] 解析工具参数失败，返回原始字符串以便诊断:", {
          firstError,
          secondError,
          rawArguments,
        });
        throw secondError;
      }
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
    console.log("[Agent] 开始执行Agent调用");

    const allTools = this.mcpList
      .map((mcp) => mcp.getTools().map(this.convertOpenAITool))
      .flat();

    console.log("[Agent] 可用工具总数:", allTools.length);
    console.log(
      "[Agent] 工具列表:",
      allTools.map((tool) => tool.function.name)
    );

    console.log("[Agent] 发起第一次LLM对话");
    let response = await this.llm.chat(this.model, allTools);
    while (true) {
      if (response.toolCalls && response.toolCalls.length > 0) {
        console.log("[Agent] 检测到工具调用，数量:", response.toolCalls.length);

        for (const toolCall of response.toolCalls) {
          if (toolCall.type === "function") {
            console.log("[Agent] 执行工具调用:", toolCall.function.name);
            console.log("[Agent] 工具参数:", toolCall.function.arguments);

            const mcp = this.mcpList.find((mcp) =>
              mcp
                .getTools()
                .find((tool) => tool.name === toolCall.function.name)
            );
            const tool = mcp
              ?.getTools()
              .find((tool) => tool.name === toolCall.function?.name);
            if (tool) {
              console.log(
                "[Agent] 找到对应的MCP客户端和工具",
                JSON.stringify(tool)
              );
              const toolRes = await mcp?.invoke(
                tool,
                this.safeParseToolArguments(toolCall.function.arguments)
              );
              console.log("toolRes:", toolRes);
              if (toolRes?.content) {
                this.llm.addMessage({
                  role: "tool",
                  tool_call_id: toolCall.id!,
                  content: toolRes?.content[0]?.text,
                });
              } else {
                console.log("[Agent] 工具执行失败，返回空结果");
                this.llm.addMessage({
                  role: "tool",
                  tool_call_id: toolCall.id!,
                  content: "Tool not found",
                });
              }
            } else {
              console.log("[Agent] 未找到对应的工具:", toolCall.function.name);
            }
          }
        }

        response = await this.llm.chat(this.model, allTools);
        continue;
      }

      await this.mcpList.forEach((mcp) => mcp.close());
      console.log("[Agent] Agent执行完成");
      return response.streamContent;
    }
  }
}
