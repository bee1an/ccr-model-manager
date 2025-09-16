# 贡献指南

感谢您对 ccr-update 项目的关注！我们欢迎任何形式的贡献。

## 如何贡献

### 报告问题

如果您发现了 bug 或有功能建议，请通过 [GitHub Issues](https://github.com/yourusername/ccr-update/issues) 报告。

在报告问题时，请包含以下信息：

- 清晰的标题
- 详细的问题描述
- 重现步骤
- 预期行为
- 实际行为
- 环境信息（操作系统、Node.js 版本等）
- 相关的错误日志或截图

### 提交代码

1. **Fork 仓库**
   - 访问 [ccr-update](https://github.com/yourusername/ccr-update) 仓库
   - 点击右上角的 "Fork" 按钮

2. **克隆您的 fork**
   ```bash
   git clone https://github.com/yourusername/ccr-update.git
   cd ccr-update
   ```

3. **创建新分支**
   ```bash
   git checkout -b feature/your-feature-name
   ```

4. **进行更改**
   - 编写代码
   - 添加测试（如果适用）
   - 确保代码符合项目风格
   - 更新文档（如果需要）

5. **提交更改**
   ```bash
   git add .
   git commit -m "Add your feature description"
   ```

6. **推送到您的 fork**
   ```bash
   git push origin feature/your-feature-name
   ```

7. **创建 Pull Request**
   - 访问您 fork 的仓库
   - 点击 "New Pull Request"
   - 填写 PR 描述
   - 提交 PR

## 开发环境设置

### 环境要求

- Node.js 18+
- pnpm 8+

### 安装步骤

```bash
# 克隆仓库
git clone https://github.com/yourusername/ccr-update.git
cd ccr-update

# 安装依赖
pnpm install

# 开发模式（监听文件变化）
pnpm run dev

# 构建
pnpm run build
```

## 代码规范

- 使用 TypeScript 编写代码
- 遵循现有的代码风格
- 添加适当的注释和文档
- 确保所有功能都有适当的错误处理

## 提交消息规范

使用语义化的提交消息格式：

```
<type>(<scope>): <subject>

<body>

<footer>
```

### 类型

- `feat`: 新功能
- `fix`: 修复 bug
- `docs`: 文档更改
- `style`: 代码格式（不影响代码运行的变动）
- `refactor`: 重构（既不是新增功能，也不是修改 bug 的代码变动）
- `perf`: 性能优化
- `test`: 增加测试
- `chore`: 构建过程或辅助工具的变动

### 示例

```
feat(select): add provider filtering option

Add a new option to filter providers by name in the select command.
This helps users quickly find the provider they are looking for.

Closes #123
```

## 测试

在提交 PR 之前，请确保：

1. 所有现有测试都通过
2. 新功能有相应的测试
3. 代码构建成功
4. 在不同环境下测试您的更改

## 发布流程

项目维护者会定期合并 PR 并发布新版本。发布流程如下：

1. 更新版本号
2. 更新 CHANGELOG.md
3. 创建发布标签
4. 发布到 npm
5. 创建 GitHub Release

## 行为准则

请尊重所有项目参与者。我们致力于创建一个友好、包容的环境。不当行为将不会被容忍。

## 问题

如果您有任何问题或需要帮助，请：

1. 查看 [文档](README.md)
2. 搜索现有的 [Issues](https://github.com/yourusername/ccr-update/issues)
3. 创建新的 Issue

感谢您的贡献！