import { cwd } from 'process';
import { Agent } from './Agent';
import { MCPClient } from './MCPClient';
import { Logger } from './Logger';
import 'dotenv/config';

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

  logger.separator('=', 60);
  logger.info('开始执行 Agent MVP');
  logger.separator('=', 60);

  logger.step(1, '连接MCP客户端');

  logger.info('连接文件MCP客户端...');
  await fileMCP.connect();

  logger.info('连接烹饮MCP客户端...');
  await howtocookMCP.connect();

  logger.success('所有MCP客户端连接完成');

  logger.step(2, '创建Agent实例');

  const agent = new Agent(
    'kimi-k2-0905-preview',
    [fileMCP, howtocookMCP],
    'You are a helpful assistant that can help me cook a meal.',
    '我想要吃红烧茄子，查询一下如何做，输出一份详细的关于红烧茄子的MD文档到output目录下',
  );
  logger.success('Agent实例创建完成');

  logger.step(3, '执行Agent任务');

  const startTime = Date.now();
  const response = await agent.invoke();
  const endTime = Date.now();

  logger.success('Agent任务执行完成');
  logger.performance('Agent任务', endTime - startTime);
  logger.info('最终响应长度:', response?.length || 0);

  logger.separator('=', 60);
  logger.success('Agent MVP 执行完成');
  logger.separator('=', 60);

  console.log('\n' + response);
}

main().catch((error) => {
  const logger = Logger.getInstance('Main');
  logger.error('程序执行失败:', error);
  process.exit(1);
});
