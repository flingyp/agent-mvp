import { cwd } from "process";
import { Agent } from "./Agent";
import { MCPClient } from "./MCPClient";
import "dotenv/config";

const outPath = `${cwd()}/output`;

const fileMCP = new MCPClient("mcp-server-file", "1.0.0", "npx", [
  "-y",
  "@modelcontextprotocol/server-filesystem",
  outPath,
]);
const howtocookMCP = new MCPClient("mcp-server-howtocook", "1.0.0", "npx", [
  "-y",
  "howtocook-mcp",
]);

async function main() {
  console.log(
    "[Main] =================== 开始执行 Agent MVP ===================\n"
  );

  console.log("[Main] 步骤1: 连接MCP客户端");
  console.log("[Main] 连接文件MCP客户端...");
  await fileMCP.connect();

  console.log("[Main] 连接烹饮MCP客户端...");
  await howtocookMCP.connect();
  console.log("[Main] 所有MCP客户端连接完成\n");

  console.log("[Main] 步骤2: 创建Agent实例");
  const agent = new Agent(
    "kimi-k2-0905-preview",
    [fileMCP, howtocookMCP],
    "You are a helpful assistant that can help me cook a meal.",
    "我想要吃辣椒炒肉，查询一下如何做，输出一份详细的关于辣椒炒肉的MD文档到output目录下"
  );
  console.log("[Main] Agent实例创建完成\n");

  console.log("[Main] 步骤3: 执行Agent任务");
  const startTime = Date.now();
  const response = await agent.invoke();
  const endTime = Date.now();

  console.log("\n[Main] Agent任务执行完成");
  console.log("[Main] 执行时间:", endTime - startTime, "ms");
  console.log("[Main] 最终响应长度:", response?.length || 0);
  console.log(
    "\n[Main] =================== Agent MVP 执行完成 ===================\n"
  );

  console.log(response);
}

main().catch((error) => {
  console.error("[Main] 程序执行失败:", error);
  process.exit(1);
});
