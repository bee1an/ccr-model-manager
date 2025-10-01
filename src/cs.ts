#!/usr/bin/env node

import { SelectCommand } from './commands/select';
import { readFileSync } from 'fs';

// 检查命令行参数
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  console.log('cs - CCR模型选择命令 (cmm select的简写)');
  console.log('');
  console.log('用法:');
  console.log('  cs              启动交互式模型选择');
  console.log('  cs --help       显示帮助信息');
  console.log('  cs --version    显示版本信息');
  console.log('');
  console.log('说明:');
  console.log('  cs命令是cmm select的独立简写版本，功能完全相同。');
  process.exit(0);
}

if (args.includes('--version') || args.includes('-v')) {
  const packageJson = JSON.parse(readFileSync('./package.json', 'utf8'));
  console.log(packageJson.version);
  process.exit(0);
}

// 直接执行select命令
SelectCommand.execute().catch(error => {
  console.error('cs命令执行失败:', error);
  process.exit(1);
});