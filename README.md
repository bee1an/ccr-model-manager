# CCR Model Manager

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![Version](https://img.shields.io/badge/version-1.3.0-brightgreen.svg)](https://github.com/bee1an/ccr-model-manager/releases)

> 🚀 一个用于管理 Claude Code Router (CCR) 模型配置的现代化命令行工具，支持交互式选择模型提供商和模型 ID。

## ✨ 功能特性

- 🔍 **模型列表查看** - 列出 CCR 中配置的所有模型提供商和模型 ID
- 🎯 **智能选择** - 交互式选择模型提供商和模型 ID
- ⚡ **快速选择** - 提供独立cs命令进行快速模型选择
- 🚫 **自动过滤** - 自动过滤已弃用的提供商
- 🔄 **一键更新** - 更新 CCR 配置文件并自动重启 CCR

## 📦 安装

### 使用 npm 安装

```bash
npm install -g ccr-model-manager
```

## 🚀 使用方法

### 查看帮助信息

```bash
cmm --help
```

### 查看版本信息

```bash
cmm --version
```

### 列出所有可用的模型提供商和模型 ID

列出 CCR 配置中所有可用的模型提供商和对应的模型 ID，并显示当前选择的模型。

```bash
cmm list
```

**输出示例：**
```
📋 CCR 模型配置列表

🔗 当前配置：
  • 默认模式: openai,gpt-4-turbo
  • 背景模式: openai,gpt-4-turbo
  • 思考模式: openai,gpt-4-turbo
  • 长文本模式: openai,gpt-4-turbo
  • 网络搜索模式: openai,gpt-4-turbo

🏢 可用提供商：
  • openai
      └─ gpt-4-turbo (当前选择)
      └─ gpt-4
      └─ gpt-3.5-turbo

  • anthropic
      └─ claude-3-opus-20240229
      └─ claude-3-sonnet-20240229
```

### 选择模型提供商和模型 ID

交互式选择模型提供商和模型 ID，支持选择性更新。

```bash
cmm select
```

**交互示例：**
```
❓ 请选择要更新的路由模式：
  ◉ 默认模式
  ◯ 背景模式
  ◯ 思考模式
  ◯ 长文本模式
  ◯ 网络搜索模式

❓ 请选择模型提供商：
  ◉ openai
  ◯ anthropic
  ◯ google

❓ 请选择模型 ID：
  ◉ gpt-4-turbo
  ◯ gpt-4
  ◯ gpt-3.5-turbo

✅ 配置更新成功！正在重启 CCR 服务...
```

### 快速选择模型提供商和模型 ID

`cs` 命令是一个独立的单命令，功能与 `cmm select` 完全相同，提供更便捷的快速访问方式。

```bash
cs
```

**功能说明：**
- 与 `cmm select` 完全等价的独立命令
- 提供相同的交互式选择界面
- 支持选择性更新路由模式
- 适合快速输入的场景

**支持的参数：**
```bash
cs              # 启动交互式模型选择
cs --help       # 显示帮助信息
cs --version    # 显示版本信息
```

### 查看路由配置详情

显示当前CCR路由配置的详细信息，包括所有路由类型的提供商、模型和状态。

```bash
cmm routers
```

## ⚙️ 配置文件

### 配置文件位置

工具会自动读取用户主目录下的 CCR 配置文件：

```
~/.claude-code-router/config.json
```

### 配置文件结构

配置文件应包含以下结构：

```json
{
  "Providers": [
    {
      "name": "openai",
      "api_base_url": "https://api.openai.com/v1",
      "api_key": "your_openai_api_key",
      "models": ["gpt-4-turbo", "gpt-4", "gpt-3.5-turbo"],
      "deprecated": false
    },
    {
      "name": "anthropic",
      "api_base_url": "https://api.anthropic.com",
      "api_key": "your_anthropic_api_key",
      "models": ["claude-3-opus-20240229", "claude-3-sonnet-20240229"],
      "deprecated": false
    },
    {
      "name": "legacy-provider",
      "api_base_url": "https://api.legacy.com",
      "api_key": "your_legacy_api_key",
      "models": ["legacy-model"],
      "deprecated": true
    }
  ],
  "Router": {
    "default": "openai,gpt-4-turbo",
    "background": "openai,gpt-4-turbo",
    "think": "openai,gpt-4-turbo",
    "longContext": "openai,gpt-4-turbo",
    "webSearch": "openai,gpt-4-turbo"
  }
}
```

## 📄 许可证

本项目采用 [MIT 许可证](LICENSE) - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🙏 致谢

- [Claude Code Router](https://github.com/example/claude-code-router) - 本工具所管理的项目

