import { UpdateService } from '../services/updater';
import { FormatUtils } from '../utils/format';

/**
 * Update命令实现 - 基于npm的简洁版本
 */
export class UpdateCommand {
  /**
   * 执行update命令 - 检查并更新到最新版本
   */
  static async execute(): Promise<void> {
    try {
      const result = await UpdateService.performUpdate();

      if (result.success) {
        FormatUtils.showSuccess(`🎉 ${result.message}`);

        if (result.currentVersion && result.newVersion &&
            result.currentVersion !== result.newVersion) {
          console.log(`${FormatUtils.formatInfo('从:')} ${result.currentVersion}`);
          console.log(`${FormatUtils.formatSuccess('到:')} ${result.newVersion}`);
          console.log('');
          console.log(FormatUtils.formatInfo('请重新启动命令行工具以使用新版本。'));
        }
      } else {
        FormatUtils.showError(`❌ ${result.message}`);

        // 显示建议信息
        if ('suggestion' in result) {
          console.log(FormatUtils.formatWarning(`建议: ${(result as any).suggestion}`));
        }

        // 显示错误详情
        if (result.error) {
          console.log(FormatUtils.formatInfo(`错误详情: ${result.error}`));
        }
      }

    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('网络')) {
          FormatUtils.showError('网络错误，请检查网络连接后重试。');
        } else if (error.message.includes('npm')) {
          FormatUtils.showError('npm操作失败，请确保npm已正确安装。');
        } else {
          FormatUtils.showError(`更新失败: ${error.message}`);
        }
      } else {
        FormatUtils.showError('更新失败：未知错误');
      }
      console.error(error); // 详细错误信息用于调试
    }
  }
}