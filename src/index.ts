import { cwd } from 'process';
import { Agent } from './Agent';
import { MCPClient } from './MCPClient';
import { Logger } from './Logger';
import 'dotenv/config';
import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

const outPath = `${cwd()}/output`;

const fileMCP = new MCPClient('mcp-server-file', '1.0.0', 'npx', [
  '-y',
  '@modelcontextprotocol/server-filesystem',
  outPath,
]);
const howtocookMCP = new MCPClient('mcp-server-howtocook', '1.0.0', 'npx', [
  '-y',
  'howtocook-mcp',
]);

async function main() {
  const logger = Logger.getInstance('Main');

  logger.separator('=', 100);
  logger.info('欢迎使用 Agent MVP');
  logger.info('本程序将演示使用 MCP 工具与 LLM 协作完成任务');
  logger.info('主程序需要使用到了 HowToCook、File 两个 MCP 工具');
  logger.info(
    '你可以输入一个 HowToCook 中的菜名，让 Agent 帮你查询如何做，并在生成一份详细的文档',
  );
  logger.separator('=', 100);

  logger.step(1, '获取用户输入');

  const placeholderPrompt =
    '示例：我想要吃红烧茄子，查询一下如何做，并在 output 目录生成一份详细的 MD 文档';
  const rl = createInterface({ input, output });
  const inputPrompt = await rl.question(
    `请输入你的目标（可留空，仅使用系统提示词）\n${placeholderPrompt}\n> `,
  );
  const userPrompt = inputPrompt ? inputPrompt.trim() : '';

  const confirm = await rl.question(
    '\n按回车键开始执行（输入 cancel 或 esc 取消）：',
  );

  rl.close();

  if (confirm && confirm.trim().toLowerCase() === 'cancel') {
    logger.warning('已取消执行');
    return;
  }

  if (!userPrompt) {
    logger.warning('未提供用户提示词，将仅使用系统提示词');
  }

  logger.step(2, '连接MCP客户端');

  logger.info('连接文件MCP客户端...');
  await fileMCP.connect();

  logger.info('连接烹饮MCP客户端...');
  await howtocookMCP.connect();

  logger.success('所有MCP客户端连接完成');

  logger.step(3, '创建Agent实例');

  const agent = new Agent(
    'kimi-k2-0905-preview',
    [fileMCP, howtocookMCP],
    'You are a helpful assistant that can help me cook a meal.',
    userPrompt,
  );
  logger.success('Agent实例创建完成');

  logger.step(4, '执行Agent任务');

  const startTime = Date.now();
  const response = await agent.invoke();
  const endTime = Date.now();

  logger.success('Agent任务执行完成');
  logger.performance('Agent任务', endTime - startTime);
  logger.info('最终响应长度:', response?.length || 0);

  logger.separator('=', 100);
  logger.success('Agent MVP 执行完成');
  logger.separator('=', 100);

  console.log('\n' + response);
}

main().catch((error) => {
  const logger = Logger.getInstance('Main');
  logger.error('程序执行失败:', error);
  process.exit(1);
});
