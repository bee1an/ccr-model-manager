import { ConfigService } from '../services/config';
import { FormatUtils } from '../utils/format';
import { UI_MESSAGES, ERROR_MESSAGES } from '../utils/constants';
import { Provider } from '../types';

/**
 * List命令实现
 */
export class ListCommand {
  /**
   * 执行list命令
   */
  static async execute(): Promise<void> {
    try {
      FormatUtils.showLoading(UI_MESSAGES.READING_CONFIG);

      // 获取配置和提供商列表
      const config = await ConfigService.getConfig();
      const providers = await ConfigService.getActiveProviders();

      if (providers.length === 0) {
        FormatUtils.showError(ERROR_MESSAGES.NO_PROVIDERS);
        return;
      }

      // 显示提供商和模型列表
      this.displayProviders(providers);

      // 显示当前选择
      FormatUtils.displayCurrentSelection(config);

    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * 显示提供商列表和模型
   * @param providers 提供商列表
   */
  private static displayProviders(providers: Provider[]): void {
    FormatUtils.displayProviderList(providers);
  }

  /**
   * 显示简化版的提供商信息（带统计）
   * @param providers 提供商列表
   */
  static displayProvidersWithStats(providers: Provider[]): void {
    console.log(FormatUtils.formatInfo('可用的模型提供商统计:'));
    console.log('');

    if (providers.length === 0) {
      FormatUtils.showError('未找到任何提供商');
      return;
    }

    const totalProviders = providers.length;
    const totalModels = providers.reduce((sum, provider) => sum + (provider.models?.length || 0), 0);
    const deprecatedCount = providers.filter(p => p.deprecated).length;
    const activeCount = totalProviders - deprecatedCount;

    console.log(FormatUtils.formatInfo(`总提供商数: ${totalProviders}`));
    console.log(FormatUtils.formatSuccess(`活跃提供商: ${activeCount}`));
    console.log(FormatUtils.formatWarning(`已弃用: ${deprecatedCount}`));
    console.log(FormatUtils.formatInfo(`总模型数: ${totalModels}`));
    console.log('');

    // 显示详细信息
    providers.forEach((provider, index) => {
      const status = provider.deprecated ? '🟡 已弃用' : '🟢 活跃';
      const statusColor = provider.deprecated ? 'yellow' : 'green';
      const modelCount = provider.models?.length || 0;

      console.log(`${index + 1}. ${(chalk as any)[statusColor](provider.name)} - ${status}`);
      console.log(`   模型数量: ${modelCount}`);

      if (provider.models && provider.models.length > 0) {
        console.log(`   可用模型: ${provider.models.slice(0, 3).join(', ')}${provider.models.length > 3 ? '...' : ''}`);
      }

      // 显示API基础URL
      if (provider.api_base_url) {
        console.log(`   API地址: ${provider.api_base_url}`);
      }

      console.log('');
    });
  }

  /**
   * 搜索提供商或模型
   * @param query 搜索查询字符串
   */
  static async search(query: string): Promise<void> {
    try {
      FormatUtils.showLoading(`正在搜索 "${query}"...`);

      const providers = await ConfigService.getProviders(true); // 包含已弃用的
      const lowerQuery = query.toLowerCase();

      // 搜索匹配的提供商和模型
      const matchingProviders = providers.filter(provider =>
        provider.name.toLowerCase().includes(lowerQuery)
      );

      const matchingModels: { provider: Provider; model: string }[] = [];

      providers.forEach(provider => {
        if (provider.models) {
          provider.models.forEach(model => {
            if (model.toLowerCase().includes(lowerQuery)) {
              matchingModels.push({ provider, model });
            }
          });
        }
      });

      // 显示搜索结果
      this.displaySearchResults(matchingProviders, matchingModels, query);

    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * 显示搜索结果
   * @param matchingProviders 匹配的提供商
   * @param matchingModels 匹配的模型
   * @param query 搜索查询
   */
  private static displaySearchResults(
    matchingProviders: Provider[],
    matchingModels: { provider: Provider; model: string }[],
    query: string
  ): void {
    console.log(FormatUtils.formatInfo(`搜索结果 for "${query}":`));
    console.log('');

    // 显示匹配的提供商
    if (matchingProviders.length > 0) {
      console.log(FormatUtils.formatSuccess(`匹配的提供商 (${matchingProviders.length}):`));
      matchingProviders.forEach(provider => {
        const status = provider.deprecated ? '🟡 已弃用' : '🟢 活跃';
        const statusColor = provider.deprecated ? 'yellow' : 'green';
        console.log(`  - ${(chalk as any)[statusColor](provider.name)} - ${status}`);
      });
      console.log('');
    }

    // 显示匹配的模型
    if (matchingModels.length > 0) {
      console.log(FormatUtils.formatSuccess(`匹配的模型 (${matchingModels.length}):`));

      // 按提供商分组
      const modelsByProvider = matchingModels.reduce((acc, { provider, model }) => {
        if (!acc[provider.name]) {
          acc[provider.name] = [];
        }
        acc[provider.name].push(model);
        return acc;
      }, {} as Record<string, string[]>);

      Object.entries(modelsByProvider).forEach(([providerName, models]) => {
        const provider = matchingModels.find(m => m.provider.name === providerName)?.provider;
        const statusColor = provider?.deprecated ? 'yellow' : 'green';
        console.log(`  ${(chalk as any)[statusColor](providerName)}:`);
        models.forEach(model => {
          console.log(`    - ${model}`);
        });
      });
      console.log('');
    }

    if (matchingProviders.length === 0 && matchingModels.length === 0) {
      FormatUtils.showWarning(`未找到与 "${query}" 匹配的提供商或模型`);
    }
  }

  /**
   * 导出提供商列表为JSON
   * @param outputPath 输出文件路径（可选）
   */
  static async exportToJson(outputPath?: string): Promise<void> {
    try {
      FormatUtils.showLoading('正在导出提供商数据...');

      const providers = await ConfigService.getProviders(true);
      const exportData = {
        exportedAt: new Date().toISOString(),
        totalProviders: providers.length,
        activeProviders: providers.filter(p => !p.deprecated).length,
        providers: providers.map(provider => ({
          name: provider.name,
          status: provider.deprecated ? 'deprecated' : 'active',
          apiBaseUrl: provider.api_base_url,
          models: provider.models || [],
          modelCount: provider.models?.length || 0
        }))
      };

      const jsonData = JSON.stringify(exportData, null, 2);

      if (outputPath) {
        // 如果有指定输出路径，写入文件
        const fs = await import('fs-extra');
        await fs.writeFile(outputPath, jsonData, 'utf8');
        FormatUtils.showSuccess(`提供商数据已导出到: ${outputPath}`);
      } else {
        // 否则输出到控制台
        console.log(jsonData);
      }

    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * 统一错误处理
   * @param error 错误对象
   */
  private static handleError(error: unknown): void {
    if (error instanceof Error) {
      FormatUtils.showError(`发生错误: ${error.message}`);
    } else {
      FormatUtils.showError('发生未知错误');
    }
    console.error(error); // 详细错误信息用于调试
  }
}