import { execSync } from 'child_process';
import { SYSTEM_COMMANDS, ERROR_MESSAGES, UI_MESSAGES } from '../utils/constants';
import { FormatUtils } from '../utils/format';

/**
 * CCR服务管理结果接口
 */
export interface CCRServiceResult {
  success: boolean;
  message: string;
  error?: string;
}

/**
 * CCR服务管理类
 */
export class CCRService {
  /**
   * 重启CCR服务
   * @returns Promise<CCRServiceResult> 重启结果
   */
  static async restart(): Promise<CCRServiceResult> {
    try {
      FormatUtils.showLoading(UI_MESSAGES.RESTARTING_CCR);

      // 使用ccr restart命令重启CCR
      execSync(SYSTEM_COMMANDS.CCR_RESTART, {
        stdio: 'inherit',
        timeout: 30000 // 30秒超时
      });

      FormatUtils.showSuccess(UI_MESSAGES.CCR_RESTARTED);

      return {
        success: true,
        message: UI_MESSAGES.CCR_RESTARTED
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';

      FormatUtils.showError(ERROR_MESSAGES.RESTART_FAILED);
      FormatUtils.showWarning(`您可以使用以下命令手动重启:`);
      FormatUtils.showWarning(SYSTEM_COMMANDS.CCR_RESTART);

      return {
        success: false,
        message: ERROR_MESSAGES.RESTART_FAILED,
        error: errorMessage
      };
    }
  }

  /**
   * 检查CCR服务是否可用
   * @returns Promise<boolean> 是否可用
   */
  static async isAvailable(): Promise<boolean> {
    try {
      execSync(SYSTEM_COMMANDS.CCR_RESTART, {
        stdio: 'pipe',
        timeout: 5000 // 5秒超时
      });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 获取CCR服务状态
   * @returns Promise<CCRServiceResult> 状态信息
   */
  static async getStatus(): Promise<CCRServiceResult> {
    try {
      // 尝试执行ccr命令检查状态
      execSync('ccr --version', {
        stdio: 'pipe',
        timeout: 5000
      });

      return {
        success: true,
        message: 'CCR服务已安装并可用'
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';

      return {
        success: false,
        message: 'CCR服务不可用',
        error: errorMessage
      };
    }
  }

  /**
   * 执行自定义CCR命令
   * @param command CCR命令
   * @param options 执行选项
   * @returns Promise<CCRServiceResult> 执行结果
   */
  static async executeCommand(
    command: string,
    options: {
      timeout?: number;
      showOutput?: boolean;
    } = {}
  ): Promise<CCRServiceResult> {
    const { timeout = 10000, showOutput = false } = options;
    const fullCommand = `ccr ${command}`;

    try {
      FormatUtils.showLoading(`正在执行命令: ${fullCommand}`);

      const result = execSync(fullCommand, {
        stdio: showOutput ? 'inherit' : 'pipe',
        timeout
      });

      let message = `命令执行成功: ${fullCommand}`;
      if (!showOutput && result) {
        message += `\n输出: ${result.toString().trim()}`;
      }

      FormatUtils.showSuccess(message);

      return {
        success: true,
        message
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';

      FormatUtils.showError(`命令执行失败: ${fullCommand}`);
      if (errorMessage) {
        FormatUtils.showError(`错误详情: ${errorMessage}`);
      }

      return {
        success: false,
        message: `命令执行失败: ${fullCommand}`,
        error: errorMessage
      };
    }
  }

  /**
   * 安全重启CCR服务（带配置验证）
   * @param configValidation 可选的配置验证回调
   * @returns Promise<CCRServiceResult> 重启结果
   */
  static async safeRestart(configValidation?: () => Promise<boolean>): Promise<CCRServiceResult> {
    // 如果提供了配置验证函数，先验证配置
    if (configValidation) {
      try {
        const isValid = await configValidation();
        if (!isValid) {
          return {
            success: false,
            message: '配置验证失败，中止重启操作'
          };
        }
      } catch (error) {
        return {
          success: false,
          message: '配置验证过程中出现错误',
          error: error instanceof Error ? error.message : '未知错误'
        };
      }
    }

    // 执行重启
    return await this.restart();
  }

  /**
   * 重启CCR服务并等待确认
   * @param waitForMs 等待时间（毫秒）
   * @returns Promise<CCRServiceResult> 重启结果
   */
  static async restartWithWait(waitForMs: number = 2000): Promise<CCRServiceResult> {
    const result = await this.restart();

    if (result.success) {
      // 等待指定时间让CCR完全启动
      await new Promise(resolve => setTimeout(resolve, waitForMs));

      return {
        ...result,
        message: `${result.message} (已等待${waitForMs}ms确保完全启动)`
      };
    }

    return result;
  }
}