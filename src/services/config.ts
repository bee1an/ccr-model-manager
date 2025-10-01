import fs from 'fs-extra';
import path from 'path';
import { CCRConfig, Provider } from '../types';

export class ConfigService {
  private static readonly CONFIG_PATH = path.join(process.env.HOME || '', '.claude-code-router', 'config.json');

  /**
   * 读取CCR配置文件
   * @returns Promise<CCRConfig> 配置对象
   * @throws Error 当配置文件不存在或格式错误时抛出异常
   */
  static async getConfig(): Promise<CCRConfig> {
    try {
      // 检查配置文件是否存在
      if (!await fs.pathExists(this.CONFIG_PATH)) {
        throw new Error('CCR配置文件不存在，请确保CCR已正确安装并配置');
      }

      // 读取配置文件
      const config: CCRConfig = await fs.readJson(this.CONFIG_PATH);
      return config;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`读取配置文件失败: ${error.message}`);
      }
      throw new Error('读取配置文件失败: 未知错误');
    }
  }

  /**
   * 更新CCR配置文件
   * @param config 配置对象
   * @throws Error 当写入失败时抛出异常
   */
  static async updateConfig(config: CCRConfig): Promise<void> {
    try {
      await fs.writeJson(this.CONFIG_PATH, config, { spaces: 2 });
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`更新配置文件失败: ${error.message}`);
      }
      throw new Error('更新配置文件失败: 未知错误');
    }
  }

  /**
   * 获取所有提供商列表
   * @param includeDeprecated 是否包含已弃用的提供商
   * @returns Provider[] 提供商列表
   */
  static async getProviders(includeDeprecated: boolean = false): Promise<Provider[]> {
    const config = await this.getConfig();
    const providers: Provider[] = config.Providers || [];

    if (includeDeprecated) {
      return providers;
    }

    // 过滤掉已弃用的提供商
    return providers.filter(provider => !provider.deprecated);
  }

  /**
   * 获取活跃的提供商列表
   * @returns Provider[] 活跃提供商列表
   */
  static async getActiveProviders(): Promise<Provider[]> {
    return this.getProviders(false);
  }

  /**
   * 根据名称查找提供商
   * @param name 提供商名称
   * @returns Provider | null 找到的提供商，如果不存在返回null
   */
  static async getProviderByName(name: string): Promise<Provider | null> {
    const providers = await this.getProviders(true);
    return providers.find(provider => provider.name === name) || null;
  }

  /**
   * 检查配置文件是否存在
   * @returns Promise<boolean> 配置文件是否存在
   */
  static async configExists(): Promise<boolean> {
    return await fs.pathExists(this.CONFIG_PATH);
  }

  /**
   * 获取Router配置
   * @returns Promise<CCRConfig['Router']> Router配置
   */
  static async getRouterConfig(): Promise<CCRConfig['Router']> {
    const config = await this.getConfig();
    if (!config.Router) {
      throw new Error('未找到Router配置');
    }
    return config.Router;
  }

  /**
   * 更新Router配置
   * @param routerConfig Router配置
   * @throws Error 当更新失败时抛出异常
   */
  static async updateRouterConfig(routerConfig: CCRConfig['Router']): Promise<void> {
    const config = await this.getConfig();
    config.Router = routerConfig;
    await this.updateConfig(config);
  }

  /**
   * 获取配置文件路径
   * @returns string 配置文件路径
   */
  static getConfigPath(): string {
    return this.CONFIG_PATH;
  }
}