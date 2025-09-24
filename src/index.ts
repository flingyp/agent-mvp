import { Agent } from "./Agent";
import { MCPClient } from "./MCPClient";
import path from "path";

const outPath = path.join(__dirname, "output");
console.log("outPath:", outPath);

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
  await fileMCP.connect();
  await howtocookMCP.connect();

  const agent = new Agent(
    "kimi-k2-0905-preview",
    [fileMCP, howtocookMCP],
    "You are a helpful assistant that can help me cook a meal.",
    "我想要吃辣椒炒肉，查询一下如何做，输出一份详细的关于辣椒炒肉的MD文档到output目录下"
  );

  const response = await agent.invoke();
  console.log(response);
}

main();
