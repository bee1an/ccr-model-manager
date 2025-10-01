[根目录](../CLAUDE.md) > **src**

# src 模块文档

## 模块职责

src模块是CCR模型管理器的核心业务模块，负责：
- 解析和读取CCR配置文件
- 提供交互式命令行界面
- 实现模型选择和配置更新逻辑
- 处理CCR服务重启

## 入口与启动

### 主入口文件：index.ts
```typescript
#!/usr/bin/env node
```

**启动流程：**
1. 导入依赖模块（Commander、Inquirer、Chalk等）
2. 创建CLI程序实例
3. 定义两个主要命令：`select` 和 `list`
4. 解析命令行参数并执行相应逻辑

### 命令结构
```typescript
program
  .name('cmm')
  .description('CCR模型管理器')
  .version('1.0.0');

program
  .command('select')
  .description('选择CCR模型提供商和模型ID')
  .action(async () => { /* 交互式选择逻辑 */ });

program
  .command('list')
  .description('列出所有可用的模型提供商和模型ID')
  .action(async () => { /* 列出模型逻辑 */ });
```

## 对外接口

### CLI命令接口
- `cmm select` - 交互式选择模型提供商和模型ID
- `cmm list` - 列出所有可用的模型提供商和模型ID

### 核心功能接口
1. **配置文件读取**：`fs.readJson(configPath)`
2. **交互式选择**：`inquirer.prompt()`
3. **配置文件更新**：`fs.writeJson(configPath, updatedConfig)`
4. **CCR重启**：`execSync('ccr restart')`

## 关键依赖与配置

### 外部依赖
- **commander**: CLI框架，用于解析命令行参数
- **inquirer**: 交互式命令行界面，提供选择功能
- **chalk**: 终端颜色输出，美化命令行界面
- **fs-extra**: 增强的文件系统操作
- **child_process**: 执行外部命令（CCR重启）

### 内部依赖
- **types.ts**: 提供TypeScript类型定义

### 配置依赖
- **tsdown.config.ts**: 构建配置
- **tsconfig.json**: TypeScript编译配置
- **package.json**: 项目包配置

## 数据模型

### 核心数据结构（来自types.ts）

```typescript
export interface Provider {
  name: string;
  api_base_url: string;
  api_key: string;
  models: string[];
  deprecated?: boolean;
  transformer?: {
    use: string[];
  };
}

export interface Router {
  default: string;
  background: string;
  think: string;
  longContext: string;
  webSearch: string;
}

export interface CCRConfig {
  LOG: boolean;
  LOG_LEVEL: string;
  CLAUDE_PATH: string;
  HOST: string;
  PORT: number;
  APIKEY: string;
  API_TIMEOUT_MS: string;
  PROXY_URL: string;
  transformers: any[];
  Providers: Provider[];
  StatusLine: {
    enabled: boolean;
    currentStyle: string;
    default: { modules: any[] };
    powerline: { modules: any[] };
  };
  Router: Router;
}
```

### 数据流
1. **配置文件路径**：`~/.claude-code-router/config.json`
2. **数据读取**：`CCRConfig` 类型解析
3. **数据过滤**：跳过 `deprecated: true` 的提供商
4. **数据更新**：更新 `Router` 配置
5. **数据写入**：写回配置文件

## 测试与质量

### 当前测试状况
- **单元测试**: 无
- **集成测试**: 无
- **CLI测试**: 无

### 建议的测试策略
1. **配置文件解析测试**
   - 测试格式正确的配置文件解析
   - 测试格式错误的配置文件处理
   - 测试缺失配置文件的处理

2. **交互流程测试**
   - 测试提供商选择逻辑
   - 测试模型选择逻辑
   - 测试路由模式选择逻辑

3. **功能集成测试**
   - 测试完整的select命令流程
   - 测试list命令输出
   - 测试配置文件更新功能

### 质量工具
- **TypeScript**: 类型安全保障
- **ESLint**: 代码风格检查（未配置）
- **Prettier**: 代码格式化（未配置）

## 常见问题 (FAQ)

### Q: 如何处理配置文件不存在的情况？
A: 在 `src/index.ts` 第28-32行，检查文件是否存在并给出错误提示。

### Q: 如何过滤已弃用的提供商？
A: 在 `src/index.ts` 第51-52行和第209-210行，使用 `if (provider.deprecated) return;` 进行过滤。

### Q: 如何自定义配置文件路径？
A: 当前硬编码为 `~/.claude-code-router/config.json`，建议未来支持通过参数或环境变量自定义。

### Q: 重启CCR失败时如何处理？
A: 在 `src/index.ts` 第171-175行，捕获异常并提示用户手动重启。

### Q: 如何扩展新的路由模式？
A: 需要修改 `src/index.ts` 第104-129行的路由选项列表，并更新 `types.ts` 中的Router接口。

## 相关文件清单

### 源码文件
- **`src/index.ts`** - 主入口文件，包含完整CLI逻辑
- **`src/types.ts`** - TypeScript类型定义文件

### 配置文件
- **`tsconfig.json`** - TypeScript编译配置
- **`tsdown.config.ts`** - 构建工具配置
- **`package.json`** - 项目包配置

### 生成文件
- **`dist/index.js`** - 编译后的JavaScript文件
- **`dist/index.d.ts`** - 类型定义文件

### 文档文件
- **`README.md`** - 项目说明文档
- **`CHANGELOG.md`** - 变更记录
- **`CLAUDE.md`** - AI上下文文档

## 变更记录 (Changelog)

### 2025-10-01 22:54:12 - 模块文档初始化
- 新增 src/CLAUDE.md 模块文档
- 添加导航面包屑链接
- 完成模块结构分析和功能梳理
- 记录关键代码片段和数据流

### 2025-09-23 - v1.1.0 功能更新
- 在 `src/index.ts` 中添加多选功能支持
- 优化交互流程，允许用户选择性更新路由模式
- 改进用户体验，默认全选路由模式

### 2025-09-10 - v1.0.1 修复更新
- 修改CCR重启命令为 `ccr restart`
- 更新项目名称和许可证信息