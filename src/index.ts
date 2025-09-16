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
      
      // 更新配置文件
      // 更新Router配置中的默认提供商和模型
      const updatedConfig = {
        ...config,
        Router: {
          ...config.Router,
          default: `${selectedProvider},${selectedModel}`,
          background: `${selectedProvider},${selectedModel}`,
          think: `${selectedProvider},${selectedModel}`,
          longContext: `${selectedProvider},${selectedModel}`,
          webSearch: `${selectedProvider},${selectedModel}`
        }
      };
      
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

program.parse();