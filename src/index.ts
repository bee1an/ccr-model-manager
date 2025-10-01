#!/usr/bin/env node

import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import { execSync } from 'child_process';
import { CCRConfig, Provider } from './types';

const program = new Command();

program
  .name('cmm')
  .description('CCR模型管理器')
  .version('1.0.0');

program
  .command('select')
  .description('选择CCR模型提供商和模型ID')
  .action(async () => {
    try {
      console.log(chalk.blue('正在读取CCR配置文件...'));
      
      // 假设CCR配置文件位于用户主目录下的.claude-code-router/config.json
      const configPath = path.join(process.env.HOME || '', '.claude-code-router', 'config.json');
      
      // 检查配置文件是否存在
      if (!await fs.pathExists(configPath)) {
        console.log(chalk.red('CCR配置文件不存在，请确保CCR已正确安装并配置'));
        return;
      }
      
      // 读取配置文件
      const config: CCRConfig = await fs.readJson(configPath);
      
      // 提取模型提供商和模型ID
      const providers: Provider[] = config.Providers || [];
      
      if (providers.length === 0) {
        console.log(chalk.red('未找到任何模型提供商配置'));
        return;
      }
      
      console.log(chalk.green('找到以下模型提供商:'));
      
      // 创建选择列表，过滤掉已弃用的提供商
      const choices: { name: string; value: string; models: string[] }[] = [];
      
      providers.forEach(provider => {
        // 跳过已弃用的提供商
        if (provider.deprecated) return;
        
        if (provider.models && provider.models.length > 0) {
          choices.push({
            name: provider.name,
            value: provider.name,
            models: provider.models
          });
        }
      });
      
      if (choices.length === 0) {
        console.log(chalk.red('未找到任何模型配置'));
        return;
      }
      
      // 第一步：选择提供商
      const { selectedProvider } = await inquirer.prompt([
        {
          type: 'list',
          name: 'selectedProvider',
          message: '请选择模型提供商:',
          choices: choices.map(choice => ({
            name: choice.name,
            value: choice.value
          }))
        }
      ]);
      
      // 第二步：选择模型ID
      const selectedChoice = choices.find(choice => choice.value === selectedProvider);
      if (!selectedChoice) {
        console.log(chalk.red('选择提供商时出错'));
        return;
      }
      
      const { selectedModel } = await inquirer.prompt([
        {
          type: 'list',
          name: 'selectedModel',
          message: `请选择${selectedProvider}的模型ID:`,
          choices: selectedChoice.models.map(model => ({
            name: model,
            value: model
          }))
        }
      ]);
      
      console.log(chalk.blue(`您选择了: ${selectedProvider} - ${selectedModel}`));
      
      // 第三步：选择要更新的路由模式
      // 创建路由选项并默认全选
      const routeOptions = [
        {
          name: `默认路由 (当前: ${config.Router.default})`,
          value: 'default',
          checked: true  // 默认选中
        },
        {
          name: `背景路由 (当前: ${config.Router.background})`,
          value: 'background',
          checked: true  // 默认选中
        },
        {
          name: `思考路由 (当前: ${config.Router.think})`,
          value: 'think',
          checked: true  // 默认选中
        },
        {
          name: `长上下文路由 (当前: ${config.Router.longContext})`,
          value: 'longContext',
          checked: true  // 默认选中
        },
        {
          name: `网页搜索路由 (当前: ${config.Router.webSearch})`,
          value: 'webSearch',
          checked: true  // 默认选中
        }
      ];
      
      const { selectedRoutes } = await inquirer.prompt([
        {
          type: 'checkbox',
          name: 'selectedRoutes',
          message: '请选择要更新的路由模式（可多选）:',
          choices: routeOptions,
          validate: (answers: string[]) => {
            if (answers.length === 0) {
              return '请至少选择一个路由模式';
            }
            return true;
          }
        }
      ]);
      
      // 更新配置文件
      // 只更新用户选择的路由模式
      const updatedConfig = {
        ...config,
        Router: {
          ...config.Router
        }
      };
      
      // 为每个选定的路由设置新的提供商和模型
      const modelConfig = `${selectedProvider},${selectedModel}`;
      selectedRoutes.forEach((route: string) => {
        updatedConfig.Router[route as keyof typeof updatedConfig.Router] = modelConfig;
      });
      
      await fs.writeJson(configPath, updatedConfig, { spaces: 2 });
      console.log(chalk.green('配置文件已更新'));
      
      // 重启CCR
      console.log(chalk.blue('正在重启CCR...'));
      try {
        // 使用ccr restart命令重启CCR
        execSync('ccr restart', { stdio: 'inherit' });
        console.log(chalk.green('CCR已重新启动'));
      } catch (error) {
        console.log(chalk.yellow('无法自动重启CCR，请手动重启'));
        console.log(chalk.yellow('您可以使用以下命令手动重启:'));
        console.log(chalk.yellow('ccr restart'));
      }
      
      console.log(chalk.green('操作完成!'));
    } catch (error) {
      console.error(chalk.red('发生错误:'), error);
    }
  });

program
  .command('list')
  .description('列出所有可用的模型提供商和模型ID')
  .action(async () => {
    try {
      console.log(chalk.blue('正在读取CCR配置文件...'));

      const configPath = path.join(process.env.HOME || '', '.claude-code-router', 'config.json');

      if (!await fs.pathExists(configPath)) {
        console.log(chalk.red('CCR配置文件不存在，请确保CCR已正确安装并配置'));
        return;
      }

      const config: CCRConfig = await fs.readJson(configPath);
      const providers: Provider[] = config.Providers || [];

      if (providers.length === 0) {
        console.log(chalk.red('未找到任何模型提供商配置'));
        return;
      }

      console.log(chalk.green('可用的模型提供商和模型ID:'));
      console.log('');

      providers.forEach(provider => {
        // 跳过已弃用的提供商
        if (provider.deprecated) return;

        console.log(chalk.yellow(`提供商: ${provider.name}`));

        if (provider.models && provider.models.length > 0) {
          provider.models.forEach(model => {
            console.log(`  - ${model}`);
          });
        } else {
          console.log(chalk.red('  无可用模型'));
        }
        console.log('');
      });

      // 显示当前选择的提供商和模型
      if (config.Router && config.Router.default) {
        const [currentProvider, currentModel] = config.Router.default.split(',');
        console.log(chalk.blue(`当前选择: ${currentProvider} - ${currentModel}`));
      }
    } catch (error) {
      console.error(chalk.red('发生错误:'), error);
    }
  });

program
  .command('routers')
  .description('查看当前CCR所有router对应的模型信息')
  .action(async () => {
    await displayRouterModels();
  });

async function displayRouterModels() {
  try {
    console.log(chalk.blue('正在读取CCR配置文件...'));

    const configPath = path.join(process.env.HOME || '', '.claude-code-router', 'config.json');

    if (!await fs.pathExists(configPath)) {
      console.log(chalk.red('CCR配置文件不存在，请确保CCR已正确安装并配置'));
      return;
    }

    const config: CCRConfig = await fs.readJson(configPath);
    const providers: Provider[] = config.Providers || [];

    if (providers.length === 0) {
      console.log(chalk.red('未找到任何模型提供商配置'));
      return;
    }

    if (!config.Router) {
      console.log(chalk.red('未找到Router配置'));
      return;
    }

    // 解析router配置
    const routerConfigs = [
      { type: 'default', value: config.Router.default },
      { type: 'background', value: config.Router.background },
      { type: 'think', value: config.Router.think },
      { type: 'longContext', value: config.Router.longContext },
      { type: 'webSearch', value: config.Router.webSearch }
    ];

    // 显示表格标题
    console.log(chalk.green('当前 CCR Router 配置'));
    console.log('');

    // 表格头部 - 根据实际数据调整列宽
    const header = '┌─────────────┬────────────────────────────┬─────────────────────┬──────────────┐';
    const separator = '├─────────────┼────────────────────────────┼─────────────────────┼──────────────┤';
    const footer = '└─────────────┴────────────────────────────┴─────────────────────┴──────────────┘';

    console.log(header);
    console.log('│ Router Type │ Provider                  │ Model               │ Status       │');
    console.log(separator);

    // 处理每个router配置
    routerConfigs.forEach(router => {
      if (!router.value) {
        // 空配置处理
        console.log(`│ ${chalk.gray('未配置'.padEnd(11))} │ ${chalk.gray('-'.padEnd(28))} │ ${chalk.gray('-'.padEnd(19))} │ ${chalk.red('未配置').padEnd(12)} │`);
        return;
      }

      // 解析 provider:model 格式
      const [providerName, modelName] = router.value.split(',');

      if (!providerName || !modelName) {
        // 格式错误处理
        console.log(`│ ${chalk.yellow(router.type.padEnd(11))} │ ${chalk.red('格式错误'.padEnd(28))} │ ${chalk.red(router.value.padEnd(19))} │ ${chalk.red('错误').padEnd(12)} │`);
        return;
      }

      // 查找provider信息
      const provider = providers.find(p => p.name === providerName);

      if (!provider) {
        // provider不存在
        console.log(`│ ${chalk.yellow(router.type.padEnd(11))} │ ${chalk.red('未知提供商'.padEnd(28))} │ ${chalk.gray(modelName.padEnd(19))} │ ${chalk.red('错误').padEnd(12)} │`);
        return;
      }

      // 检查provider状态
      const isProviderDeprecated = provider.deprecated;

      // 检查model是否在provider的models列表中
      const isModelAvailable = provider.models && provider.models.includes(modelName);

      // 确定状态和颜色
      let statusText = '🟢 Active';
      let statusColor = chalk.green;
      let providerColor = chalk.white;
      let modelColor = chalk.white;

      if (isProviderDeprecated) {
        statusText = '🟡 Deprecated';
        statusColor = chalk.yellow;
        providerColor = chalk.yellow;
      } else if (!isModelAvailable) {
        statusText = '🔴 未知模型';
        statusColor = chalk.red;
        modelColor = chalk.red;
      }

      // 输出表格行
      console.log(`│ ${providerColor(router.type.padEnd(11))} │ ${providerColor(providerName.padEnd(28))} │ ${modelColor(modelName.padEnd(19))} │ ${statusColor(statusText.padEnd(12))} │`);
    });

    console.log(footer);
    console.log('');

    // 显示统计信息
    const totalRouters = routerConfigs.length;
    const configuredRouters = routerConfigs.filter(r => r.value).length;
    const activeProviders = new Set(routerConfigs
      .filter(r => r.value)
      .map(r => r.value.split(',')[0])
      .filter(name => providers.find(p => p.name === name && !p.deprecated))
    ).size;

    console.log(chalk.blue(`总计: ${configuredRouters}/${totalRouters} 路由已配置, ${activeProviders} 个活跃提供商`));

  } catch (error) {
    console.error(chalk.red('发生错误:'), error);
  }
}

program.parse();