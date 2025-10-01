import chalk from 'chalk';
import { CCRConfig, Provider } from '../types';
import { RouterType, StatusType, STATUS_CONFIG, TABLE_FORMAT, UI_MESSAGES, ROUTER_TYPES } from './constants';
import { ValidatorService, RouterConfigValidation } from '../services/validator';

/**
 * 路由显示信息接口
 */
export interface RouterDisplayInfo {
  type: RouterType;
  displayName: string;
  providerName: string;
  modelName: string;
  status: StatusType;
  isActive: boolean;
  isDeprecated: boolean;
  isModelAvailable: boolean;
}

/**
 * 表格格式化工具
 */
export class FormatUtils {
  /**
   * 显示Router配置表格
   * @param config CCR配置
   * @param providers 提供商列表
   */
  static displayRouterTable(config: CCRConfig, providers: Provider[]): void {
    console.log(chalk.green(UI_MESSAGES.CURRENT_CCR_ROUTER_CONFIG));
    console.log('');

    // 打印表格头部
    console.log(TABLE_FORMAT.HEADER);
    console.log(TABLE_FORMAT.HEADERS);
    console.log(TABLE_FORMAT.SEPARATOR);

    // 获取所有路由配置的验证结果
    const validationResults = ValidatorService.validateAllRouterConfigs(config, providers);

    // 处理每个路由
    ROUTER_TYPES.forEach(routeInfo => {
      this.displayRouterRow(routeInfo.type, validationResults.get(routeInfo.type), providers);
    });

    // 打印表格底部
    console.log(TABLE_FORMAT.FOOTER);
    console.log('');

    // 显示统计信息
    this.displayRouterStatistics(config, providers);
  }

  /**
   * 显示单行路由信息
   * @param routerType 路由类型
   * @param validation 验证结果
   * @param providers 提供商列表
   */
  private static displayRouterRow(
    routerType: RouterType,
    validation?: RouterConfigValidation,
    providers?: Provider[]
  ): void {
    const { routerType: typeWidth, provider: providerWidth, model: modelWidth, status: statusWidth } = TABLE_FORMAT.COLUMN_WIDTHS;

    if (!validation || !validation.isValid) {
      // 未配置或错误状态
      const errorText = validation?.error || '未配置';
      const typeName = chalk.gray(routerType.padEnd(typeWidth));
      const providerText = chalk.gray('-'.padEnd(providerWidth));
      const modelText = chalk.gray('-'.padEnd(modelWidth));
      const statusText = errorText === '未配置' ? chalk.red('未配置'.padEnd(statusWidth)) : chalk.red('错误'.padEnd(statusWidth));

      console.log(`│ ${typeName} │ ${providerText} │ ${modelText} │ ${statusText} │`);
      return;
    }

    // 正常配置状态
    const provider = providers?.find(p => p.name === validation.providerName);

    // 确定状态
    let status: StatusType = StatusType.ACTIVE;
    let providerColor = chalk.white;
    let modelColor = chalk.white;

    if (provider?.deprecated) {
      status = StatusType.DEPRECATED;
      providerColor = chalk.yellow;
    } else if (provider && !ValidatorService.modelExists(provider, validation.modelName!)) {
      status = StatusType.UNKNOWN_MODEL;
      modelColor = chalk.red;
    }

    // 获取状态配置
    const statusConfig = STATUS_CONFIG[status];
    const statusColor = (chalk as any)[statusConfig.color] || chalk.white;

    // 格式化输出
    const typeName = providerColor(routerType.padEnd(typeWidth));
    const providerText = providerColor(validation.providerName!.padEnd(providerWidth));
    const modelText = modelColor(validation.modelName!.padEnd(modelWidth));
    const statusText = statusColor(statusConfig.text.padEnd(statusWidth));

    console.log(`│ ${typeName} │ ${providerText} │ ${modelText} │ ${statusText} │`);
  }

  /**
   * 显示提供商列表
   * @param providers 提供商列表
   */
  static displayProviderList(providers: Provider[]): void {
    console.log(chalk.green(UI_MESSAGES.AVAILABLE_PROVIDERS));
    console.log('');

    if (providers.length === 0) {
      console.log(chalk.red('未找到任何提供商'));
      return;
    }

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
  }

  /**
   * 显示当前选择
   * @param config CCR配置
   */
  static displayCurrentSelection(config: CCRConfig): void {
    if (config.Router && config.Router.default) {
      const validation = ValidatorService.validateRouterConfig(config.Router.default);
      if (validation.isValid && validation.providerName && validation.modelName) {
        const message = UI_MESSAGES.CURRENT_SELECTION
          .replace('{provider}', validation.providerName)
          .replace('{model}', validation.modelName);
        console.log(chalk.blue(message));
      }
    }
  }

  /**
   * 显示路由统计信息
   * @param config CCR配置
   * @param providers 提供商列表
   */
  private static displayRouterStatistics(config: CCRConfig, providers: Provider[]): void {
    if (!config.Router) return;

    const routerTypes = [
      RouterType.DEFAULT,
      RouterType.BACKGROUND,
      RouterType.THINK,
      RouterType.LONG_CONTEXT,
      RouterType.WEB_SEARCH
    ];

    const totalRouters = routerTypes.length;
    const configuredRouters = routerTypes.filter(type => config.Router[type]).length;

    // 计算活跃提供商数量
    const configuredProviders = new Set<string>();
    routerTypes.forEach(type => {
      if (config.Router[type]) {
        const validation = ValidatorService.validateRouterConfig(config.Router[type]);
        if (validation.isValid && validation.providerName) {
          configuredProviders.add(validation.providerName);
        }
      }
    });

    const activeProvidersCount = Array.from(configuredProviders).filter(providerName => {
      const provider = providers.find(p => p.name === providerName);
      return provider && !provider.deprecated;
    }).length;

    console.log(chalk.blue(`总计: ${configuredRouters}/${totalRouters} 路由已配置, ${activeProvidersCount} 个活跃提供商`));
  }

  /**
   * 创建路由选择选项
   * @param config CCR配置
   * @returns 选择选项数组
   */
  static createRouteOptions(config: CCRConfig): Array<{ name: string; value: RouterType; checked: boolean }> {
    const routeOptions = [
      {
        name: `默认路由 (当前: ${config.Router?.default || '未配置'})`,
        value: RouterType.DEFAULT,
        checked: true
      },
      {
        name: `背景路由 (当前: ${config.Router?.background || '未配置'})`,
        value: RouterType.BACKGROUND,
        checked: true
      },
      {
        name: `思考路由 (当前: ${config.Router?.think || '未配置'})`,
        value: RouterType.THINK,
        checked: true
      },
      {
        name: `长上下文路由 (当前: ${config.Router?.longContext || '未配置'})`,
        value: RouterType.LONG_CONTEXT,
        checked: true
      },
      {
        name: `网页搜索路由 (当前: ${config.Router?.webSearch || '未配置'})`,
        value: RouterType.WEB_SEARCH,
        checked: true
      }
    ];

    return routeOptions;
  }

  /**
   * 格式化状态文本
   * @param status 状态类型
   * @param customText 自定义文本
   * @returns 格式化的状态文本
   */
  static formatStatus(status: StatusType, customText?: string): string {
    const config = STATUS_CONFIG[status];
    const text = customText || config.text;
    const color = (chalk as any)[config.color] || chalk.white;
    return color(text);
  }

  /**
   * 格式化错误信息
   * @param message 错误信息
   * @returns 格式化的错误信息
   */
  static formatError(message: string): string {
    return chalk.red(message);
  }

  /**
   * 格式化成功信息
   * @param message 成功信息
   * @returns 格式化的成功信息
   */
  static formatSuccess(message: string): string {
    return chalk.green(message);
  }

  /**
   * 格式化信息文本
   * @param message 信息文本
   * @returns 格式化的信息文本
   */
  static formatInfo(message: string): string {
    return chalk.blue(message);
  }

  /**
   * 格式化警告信息
   * @param message 警告信息
   * @returns 格式化的警告信息
   */
  static formatWarning(message: string): string {
    return chalk.yellow(message);
  }

  /**
   * 显示加载信息
   * @param message 加载信息
   */
  static showLoading(message: string): void {
    console.log(chalk.blue(message));
  }

  /**
   * 显示成功信息
   * @param message 成功信息
   */
  static showSuccess(message: string): void {
    console.log(chalk.green(message));
  }

  /**
   * 显示错误信息
   * @param message 错误信息
   */
  static showError(message: string): void {
    console.log(chalk.red(message));
  }

  /**
   * 显示警告信息
   * @param message 警告信息
   */
  static showWarning(message: string): void {
    console.log(chalk.yellow(message));
  }

  /**
   * 显示信息文本
   * @param message 信息文本
   */
  static showInfo(message: string): void {
    console.log(chalk.blue(message));
  }
}