import { execSync } from 'child_process';
import { FormatUtils } from '../utils/format';

/**
 * 更新信息接口
 */
export interface UpdateInfo {
  currentVersion: string;
  latestVersion: string;
  updateAvailable: boolean;
}

/**
 * 更新结果接口
 */
export interface UpdateResult {
  success: boolean;
  message: string;
  currentVersion?: string;
  newVersion?: string;
  error?: string;
  suggestion?: string;
}

/**
 * 基于npm的更新服务类
 */
export class UpdateService {
  private static readonly PACKAGE_NAME = 'ccr-model-manager';

  /**
   * 获取当前版本
   * @returns Promise<string> 当前版本
   */
  private static async getCurrentVersion(): Promise<string> {
    try {
      // 优先使用命令行获取版本
      const output = execSync('cmm --version', {
        encoding: 'utf8',
        timeout: 5000
      }).trim();

      // 提取版本号 (格式: "1.1.0")
      const versionMatch = output.match(/(\d+\.\d+\.\d+)/);
      if (versionMatch) {
        return versionMatch[1];
      }
      throw new Error('无法解析版本号');
    } catch (error) {
      // 如果命令行获取失败，从package.json读取
      try {
        const packagePath = require.resolve('../package.json');
        const packageData = require(packagePath);
        return packageData.version;
      } catch {
        throw new Error('无法获取当前版本信息');
      }
    }
  }

  /**
   * 从npm获取最新版本
   * @returns Promise<string> 最新版本
   */
  private static async getLatestVersionFromNpm(): Promise<string> {
    try {
      const output = execSync(`npm view ${this.PACKAGE_NAME} version --json`, {
        encoding: 'utf8',
        timeout: 10000
      }).trim();

      return JSON.parse(output);
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) {
        throw new Error(`包 "${this.PACKAGE_NAME}" 在npm上不存在`);
      }
      throw new Error('无法从npm获取版本信息');
    }
  }

  /**
   * 比较版本号
   * @param current 当前版本
   * @param latest 最新版本
   * @returns boolean 是否有更新
   */
  private static isNewer(current: string, latest: string): boolean {
    const currentParts = current.split('.').map(Number);
    const latestParts = latest.split('.').map(Number);

    for (let i = 0; i < Math.max(currentParts.length, latestParts.length); i++) {
      const currentPart = currentParts[i] || 0;
      const latestPart = latestParts[i] || 0;

      if (latestPart > currentPart) return true;
      if (latestPart < currentPart) return false;
    }

    return false;
  }

  /**
   * 检查更新
   * @returns Promise<UpdateInfo> 更新信息
   */
  static async checkForUpdates(): Promise<UpdateInfo> {
    try {
      FormatUtils.showLoading('正在检查更新...');

      const currentVersion = await this.getCurrentVersion();
      const latestVersion = await this.getLatestVersionFromNpm();

      const updateAvailable = this.isNewer(currentVersion, latestVersion);

      return {
        currentVersion,
        latestVersion,
        updateAvailable
      };

    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`检查更新失败: ${error.message}`);
      }
      throw new Error('检查更新失败: 未知错误');
    }
  }

  /**
   * 执行更新
   * @returns Promise<UpdateResult> 更新结果
   */
  static async performUpdate(): Promise<UpdateResult> {
    try {
      const updateInfo = await this.checkForUpdates();

      if (!updateInfo.updateAvailable) {
        return {
          success: true,
          message: '当前已是最新版本',
          currentVersion: updateInfo.currentVersion,
          newVersion: updateInfo.currentVersion
        };
      }

      // 显示更新信息
      console.log(FormatUtils.formatInfo('发现新版本！'));
      console.log(`${FormatUtils.formatSuccess('当前版本:')} ${updateInfo.currentVersion}`);
      console.log(`${FormatUtils.formatWarning('最新版本:')} ${updateInfo.latestVersion}`);
      console.log('');

      // 执行npm更新
      FormatUtils.showLoading('正在从npm更新...');

      try {
        execSync(`npm install -g ${this.PACKAGE_NAME}@latest`, {
          stdio: 'inherit',
          timeout: 300000 // 5分钟超时
        });

        return {
          success: true,
          message: `更新成功: ${updateInfo.currentVersion} -> ${updateInfo.latestVersion}`,
          currentVersion: updateInfo.currentVersion,
          newVersion: updateInfo.latestVersion
        };

      } catch (npmError) {
        // 检查是否是权限问题
        if (npmError instanceof Error && npmError.message.includes('EACCES')) {
          return {
            success: false,
            message: '权限不足，请使用管理员权限运行更新',
            error: '需要管理员权限',
            suggestion: `请运行: sudo npm install -g ${this.PACKAGE_NAME}@latest`
          };
        }

        // 其他npm错误
        if (npmError instanceof Error) {
          return {
            success: false,
            message: `npm安装失败: ${npmError.message}`,
            error: npmError.message
          };
        }

        return {
          success: false,
          message: 'npm安装失败',
          error: '未知npm错误'
        };
      }

    } catch (error) {
      if (error instanceof Error) {
        return {
          success: false,
          message: `更新失败: ${error.message}`,
          error: error.message
        };
      }
      return {
        success: false,
        message: '更新失败: 未知错误'
      };
    }
  }
}