import { ConfigService } from '../services/config';
import { ValidatorService } from '../services/validator';
import { FormatUtils } from '../utils/format';
import { UI_MESSAGES, ERROR_MESSAGES } from '../utils/constants';
import { CCRConfig, Provider } from '../types';

/**
 * Routers命令实现
 */
export class RoutersCommand {
  /**
   * 执行routers命令
   */
  static async execute(): Promise<void> {
    try {
      FormatUtils.showLoading(UI_MESSAGES.READING_CONFIG);

      // 获取配置和提供商列表
      const config = await ConfigService.getConfig();
      const providers = await ConfigService.getProviders(true); // 包含已弃用的

      // 验证配置完整性
      if (!ValidatorService.isConfigUsable(config)) {
        FormatUtils.showError(ERROR_MESSAGES.NO_ROUTER_CONFIG);
        return;
      }

      // 显示路由表格
      FormatUtils.displayRouterTable(config, providers);

    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * 处理错误
   * @param error 错误对象
   */
  private static handleError(error: unknown): void {
    if (error instanceof Error) {
      FormatUtils.showError(`发生错误: ${error.message}`);
    } else {
      FormatUtils.showError('发生未知错误');
    }
    console.error(error);
  }
}