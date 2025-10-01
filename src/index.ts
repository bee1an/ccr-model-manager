#!/usr/bin/env node

import { Command } from 'commander';
import { SelectCommand } from './commands/select';
import { ListCommand } from './commands/list';
import { RoutersCommand } from './commands/routers';
import { UpdateCommand } from './commands/update';

const program = new Command();

program
  .name('cmm')
  .description('CCR模型管理器')
  .version('1.3.0');

// 注册 select 命令
program
  .command('select')
  .description('选择CCR模型提供商和模型ID')
  .action(async () => {
    await SelectCommand.execute();
  });


// 注册 list 命令
program
  .command('list')
  .description('列出所有可用的模型提供商和模型ID')
  .action(async () => {
    await ListCommand.execute();
  });

// 注册 routers 命令
program
  .command('routers')
  .description('查看当前CCR所有router对应的模型信息')
  .action(async () => {
    await RoutersCommand.execute();
  });

// 注册update命令
program
  .command('update')
  .description('更新ccr-model-manager到最新版本')
  .action(async () => {
    await UpdateCommand.execute();
  });

// 解析命令行参数
program.parse();