# Agent MVP

一个基于 Model Context Protocol (MCP) 和大型语言模型的智能代理系统，能够通过 MCP 工具协作完成任务。

## 项目概述

Agent MVP 是一个演示项目，展示了如何使用 MCP 工具与 LLM 协作完成任务。项目主要集成了两个 MCP 工具：

- **File MCP**: 文件系统操作工具，用于在 `output` 目录中生成和操作文件
- **HowToCook MCP**: 烹饪指导工具，用于查询菜谱和烹饪方法

## 功能特性

- 🤖 基于 OpenAI 和 Anthropic 的 LLM 集成
- 🔧 MCP 工具动态发现和调用
- 📁 文件系统操作支持
- 🍳 烹饪菜谱查询功能
- 📊 详细的日志记录和性能监控
- 🎨 彩色终端输出

## 技术栈

- **语言**: TypeScript
- **运行时**: Node.js
- **LLM 提供商**: OpenAI, Anthropic, Kimi
- **MCP 协议**: Model Context Protocol
- **日志**: 自定义彩色日志系统
- **包管理**: pnpm

## 安装

1. 克隆项目

```bash
git clone <repository-url>
cd agent-mvp
```

2. 安装依赖

```bash
pnpm install
```

3. 配置环境变量
   复制 `.env.example` 为 `.env` 并填入你的 API 密钥：

```bash
cp .env.example .env
```

编辑 `.env` 文件，设置以下环境变量：

```
LLM_MODEL_URL=your_model_url_here
LLM_KEY=your_api_key_here
```

在 `src/index.ts` 中 `new Agent` 配置具体使用的模型名称

## 使用方法

1. 运行项目

```bash
pnpm dev
```

2. 按照提示输入你想要查询的菜名
3. Agent 会自动调用 HowToCook MCP 查询菜谱
4. 结果会保存在 `output` 目录中的 Markdown 文件中

示例输入：

```
我想要吃红烧茄子，查询一下如何做，并在 output 目录生成一份详细的 MD 文档
```

## 项目结构

```
src/
├── Agent.ts          # 主代理类，处理工具调用和 LLM 交互
├── LLMOpenAI.ts       # OpenAI LLM 客户端
├── LLMAnthropic.ts    # Anthropic LLM 客户端
├── MCPClient.ts       # MCP 客户端包装器
├── Logger.ts          # 彩色日志系统
└── index.ts           # 主入口文件
```

## 开发

### 代码格式化

```bash
pnpm lint
```

### 自动修复格式问题

```bash
pnpm lint:fix
```

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request！

## 支持

如有问题，请查看项目文档或提交 Issue。
