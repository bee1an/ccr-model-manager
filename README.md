# CCR 模型管理器

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)

一个用于管理 Claude Code Router (CCR) 模型配置的命令行工具，支持交互式选择模型提供商和模型 ID。

## 功能

- ✅ 列出 CCR 中配置的所有模型提供商和模型 ID
- ✅ 交互式选择模型提供商和模型 ID
- ✅ 自动过滤已弃用的提供商
- ✅ 更新 CCR 配置文件并重启 CCR
- ✅ TypeScript 支持，提供完整的类型定义

## 安装

### 从源码安装

```bash
# 克隆仓库
git clone https://github.com/yourusername/ccr-model-manager.git
cd ccr-model-manager

# 安装依赖
pnpm install

# 构建项目
pnpm run build

# 全局安装（可选）
npm install -g .
```

### 使用 npm 安装

```bash
npm install -g ccr-model-manager
```

## 使用方法

### 列出所有可用的模型提供商和模型 ID

```bash
cmm list
```

### 选择模型提供商和模型 ID

```bash
cmm select
```

## 命令说明

### `cmm list`

列出 CCR 配置中所有可用的模型提供商和对应的模型 ID，并显示当前选择的模型。

### `cmm select`

交互式选择模型提供商和模型 ID：

1. 从列表中选择一个模型提供商
2. 从该提供商的模型列表中选择一个模型 ID
3. 更新 CCR 配置文件
4. 自动重启 CCR

## 配置文件

工具会读取用户主目录下的 `.claude-code-router/config.json` 文件，该文件应包含以下结构：

```json
{
  "Providers": [
    {
      "name": "provider1",
      "api_base_url": "https://api.example.com",
      "api_key": "your_api_key",
      "models": ["model1", "model2"],
      "deprecated": false
    },
    {
      "name": "provider2",
      "api_base_url": "https://api.example.com",
      "api_key": "your_api_key",
      "models": ["model3", "model4"],
      "deprecated": true
    }
  ],
  "Router": {
    "default": "provider1,model1",
    "background": "provider1,model1",
    "think": "provider1,model1",
    "longContext": "provider1,model1",
    "webSearch": "provider1,model1"
  }
}
```

工具会自动过滤掉标记为 `deprecated: true` 的提供商。

## 开发

### 环境要求

- Node.js 18+
- pnpm 8+

### 开发步骤

```bash
# 克隆仓库
git clone https://github.com/yourusername/ccr-model-manager.git
cd ccr-model-manager

# 安装依赖
pnpm install

# 开发模式（监听文件变化）
pnpm run dev

# 构建
pnpm run build
```

## 项目结构

```
ccr-model-manager/
├── src/
│   ├── index.ts      # 主入口文件
│   └── types.ts      # TypeScript 类型定义
├── dist/             # 构建输出目录
├── .gitignore        # Git 忽略文件
├── README.md         # 项目说明
├── package.json      # 项目配置
├── tsconfig.json     # TypeScript 配置
└── tsdown.config.ts  # tsdown 打包配置
```

## 技术栈

- [TypeScript](https://www.typescriptlang.org/) - 类型安全的 JavaScript
- [tsdown](https://github.com/sxzz/tsdown) - 快速的 TypeScript 打包工具
- [Commander.js](https://commander.js/) - 命令行界面框架
- [Inquirer.js](https://github.com/SBoudrias/Inquirer.js/) - 交互式命令行界面
- [Chalk](https://github.com/chalk/chalk) - 终端颜色输出
- [fs-extra](https://github.com/jprichardson/node-fs-extra) - 增强的文件系统操作

## 许可证

本项目采用 [MIT 许可证](LICENSE) - 查看 [LICENSE](LICENSE) 文件了解详情。

## 致谢

- [Claude Code Router](https://github.com/example/claude-code-router) - 本工具所管理的项目
