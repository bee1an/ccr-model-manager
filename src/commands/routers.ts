import { ConfigService } from '../services/config';
import { ValidatorService } from '../services/validator';
import { FormatUtils } from '../utils/format';
import { UI_MESSAGES, ERROR_MESSAGES } from '../utils/constants';
import { CCRConfig, Provider } from '../types';

/**
 * 路由统计信息接口
 */
interface RouteStatistics {
  totalRouters: number;
  configuredRouters: number;
  activeProviders: number;
  deprecatedProviders: number;
  unknownModels: number;
  errorCount: number;
}

/**
 * 路由详情接口
 */
interface RouteDetails {
  type: string;
  provider: string;
  model: string;
  status: string;
  isValid: boolean;
  isDeprecated: boolean;
  isModelAvailable: boolean;
}

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

      // 显示主表格
      FormatUtils.displayRouterTable(config, providers);

      // 显示详细统计信息
      const stats = this.calculateRouteStatistics(config, providers);
      this.displayDetailedStatistics(stats);

      // 显示问题分析
      this.displayProblemAnalysis(config, providers);

      // 显示建议
      this.displayRecommendations(config, providers, stats);

    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * 计算路由统计信息
   * @param config 配置对象
   * @param providers 提供商列表
   * @returns RouteStatistics 统计信息
   */
  private static calculateRouteStatistics(
    config: CCRConfig,
    providers: Provider[]
  ): RouteStatistics {
    if (!config.Router) {
      return {
        totalRouters: 0,
        configuredRouters: 0,
        activeProviders: 0,
        deprecatedProviders: 0,
        unknownModels: 0,
        errorCount: 0
      };
    }

    const routerTypes = ['default', 'background', 'think', 'longContext', 'webSearch'];
    const totalRouters = routerTypes.length;
    let configuredRouters = 0;
    let deprecatedProviders = 0;
    let unknownModels = 0;
    let errorCount = 0;

    const usedProviders = new Set<string>();

    routerTypes.forEach(type => {
      const routeValue = config.Router[type as keyof typeof config.Router];
      if (routeValue) {
        configuredRouters++;

        const validation = ValidatorService.validateRouterConfig(routeValue);
        if (validation.isValid && validation.providerName) {
          usedProviders.add(validation.providerName);

          const provider = providers.find(p => p.name === validation.providerName);
          if (provider?.deprecated) {
            deprecatedProviders++;
          }

          if (provider && !ValidatorService.modelExists(provider, validation.modelName!)) {
            unknownModels++;
          }
        } else {
          errorCount++;
        }
      }
    });

    // 计算活跃提供商数量
    const activeProviders = Array.from(usedProviders).filter(providerName => {
      const provider = providers.find(p => p.name === providerName);
      return provider && !provider.deprecated;
    }).length;

    return {
      totalRouters,
      configuredRouters,
      activeProviders,
      deprecatedProviders,
      unknownModels,
      errorCount
    };
  }

  /**
   * 显示详细统计信息
   * @param stats 统计信息
   */
  private static displayDetailedStatistics(stats: RouteStatistics): void {
    console.log(FormatUtils.formatInfo('详细统计信息:'));
    console.log('');

    // 基础统计
    console.log(`📊 ${FormatUtils.formatSuccess(`路由配置: ${stats.configuredRouters}/${stats.totalRouters}`)}`);

    if (stats.configuredRouters > 0) {
      const configRate = ((stats.configuredRouters / stats.totalRouters) * 100).toFixed(1);
      console.log(`   配置率: ${configRate}%`);
    }

    console.log(`🏢 ${FormatUtils.formatSuccess(`活跃提供商: ${stats.activeProviders}`)}`);

    // 问题统计
    const problems = [];
    if (stats.deprecatedProviders > 0) {
      problems.push(`🟡 已弃用提供商: ${stats.deprecatedProviders}`);
    }
    if (stats.unknownModels > 0) {
      problems.push(`🔴 未知模型: ${stats.unknownModels}`);
    }
    if (stats.errorCount > 0) {
      problems.push(`❌ 配置错误: ${stats.errorCount}`);
    }

    if (problems.length > 0) {
      console.log('');
      console.log(FormatUtils.formatWarning('发现的问题:'));
      problems.forEach(problem => console.log(`   ${problem}`));
    }

    // 健康度评分
    const healthScore = this.calculateHealthScore(stats);
    const healthColor = healthScore >= 80 ? 'green' : healthScore >= 60 ? 'yellow' : 'red';
    const healthEmoji = healthScore >= 80 ? '🟢' : healthScore >= 60 ? '🟡' : '🔴';

    console.log('');
    console.log(`${healthEmoji} 配置健康度: ${FormatUtils.formatStatus(healthScore >= 80 ? 'active' : healthScore >= 60 ? 'deprecated' : 'error', `${healthScore}/100`)}`);
    console.log('');
  }

  /**
   * 计算配置健康度评分
   * @param stats 统计信息
   * @returns number 健康度评分 (0-100)
   */
  private static calculateHealthScore(stats: RouteStatistics): number {
    if (stats.totalRouters === 0) return 0;

    let score = 0;

    // 路由配置完整度 (50分)
    const configScore = (stats.configuredRouters / stats.totalRouters) * 50;
    score += configScore;

    // 提供商活跃度 (30分)
    const providerScore = stats.configuredRouters > 0 ?
      (stats.activeProviders / stats.configuredRouters) * 30 : 0;
    score += providerScore;

    // 模型可用性 (20分)
    const validConfigs = stats.configuredRouters - stats.errorCount;
    const modelScore = validConfigs > 0 ?
      ((validConfigs - stats.unknownModels) / validConfigs) * 20 : 0;
    score += modelScore;

    // 扣分项
    score -= stats.deprecatedProviders * 5;
    score -= stats.errorCount * 10;
    score -= stats.unknownModels * 3;

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  /**
   * 显示问题分析
   * @param config 配置对象
   * @param providers 提供商列表
   */
  private static displayProblemAnalysis(config: CCRConfig, providers: Provider[]): void {
    if (!config.Router) return;

    const validationResults = ValidatorService.validateAllRouterConfigs(config, providers);
    const problems: string[] = [];

    validationResults.forEach((validation, type) => {
      if (!validation.isValid && validation.error) {
        problems.push(`${type}: ${validation.error}`);
      } else if (validation.isValid && validation.providerName && validation.modelName) {
        const provider = providers.find(p => p.name === validation.providerName);
        if (!provider) {
          problems.push(`${type}: 提供商 '${validation.providerName}' 不存在`);
        } else if (provider.deprecated) {
          problems.push(`${type}: 提供商 '${validation.providerName}' 已弃用`);
        } else if (!ValidatorService.modelExists(provider, validation.modelName)) {
          problems.push(`${type}: 模型 '${validation.modelName}' 不在提供商列表中`);
        }
      }
    });

    if (problems.length > 0) {
      console.log(FormatUtils.formatWarning('🔍 问题详情分析:'));
      problems.forEach((problem, index) => {
        console.log(`   ${index + 1}. ${problem}`);
      });
      console.log('');
    }
  }

  /**
   * 显示优化建议
   * @param config 配置对象
   * @param providers 提供商列表
   * @param stats 统计信息
   */
  private static displayRecommendations(
    config: CCRConfig,
    providers: Provider[],
    stats: RouteStatistics
  ): void {
    const recommendations: string[] = [];

    // 基于统计信息的建议
    if (stats.configuredRouters < stats.totalRouters) {
      recommendations.push('为所有路由模式配置模型以获得完整功能');
    }

    if (stats.deprecatedProviders > 0) {
      recommendations.push('考虑替换已弃用的提供商以获得更好的稳定性');
    }

    if (stats.unknownModels > 0) {
      recommendations.push('检查并更新未知模型配置，确保使用有效的模型名称');
    }

    if (stats.errorCount > 0) {
      recommendations.push('修复配置错误以恢复正常功能');
    }

    // 基于提供商活跃度的建议
    const activeProviders = providers.filter(p => !p.deprecated);
    if (activeProviders.length === 0) {
      recommendations.push('添加至少一个活跃的模型提供商');
    } else if (activeProviders.length === 1 && stats.configuredRouters > 2) {
      recommendations.push('考虑添加多个提供商以提高可用性和容错性');
    }

    // 基于健康度的建议
    const healthScore = this.calculateHealthScore(stats);
    if (healthScore >= 90) {
      recommendations.push('✅ 配置状态优秀，继续保持！');
    } else if (healthScore >= 70) {
      recommendations.push('👍 配置状态良好，有少量改进空间');
    } else if (healthScore >= 50) {
      recommendations.push('⚠️  配置状态一般，建议进行优化');
    } else {
      recommendations.push('🚨 配置状态较差，需要立即优化');
    }

    if (recommendations.length > 0) {
      console.log(FormatUtils.formatInfo('💡 优化建议:'));
      recommendations.forEach((recommendation, index) => {
        console.log(`   ${index + 1}. ${recommendation}`);
      });
      console.log('');
    }
  }

  /**
   * 以JSON格式输出路由配置
   * @param pretty 是否格式化输出
   */
  static async exportToJson(pretty: boolean = true): Promise<void> {
    try {
      FormatUtils.showLoading('正在导出路由配置...');

      const config = await ConfigService.getConfig();
      const providers = await ConfigService.getProviders(true);

      if (!config.Router) {
        FormatUtils.showError(ERROR_MESSAGES.NO_ROUTER_CONFIG);
        return;
      }

      // 构建详细的路由信息
      const routerDetails = this.buildRouterDetails(config.Router, providers);
      const stats = this.calculateRouteStatistics(config, providers);
      const healthScore = this.calculateHealthScore(stats);

      const exportData = {
        exportedAt: new Date().toISOString(),
        summary: {
          totalRouters: stats.totalRouters,
          configuredRouters: stats.configuredRouters,
          activeProviders: stats.activeProviders,
          healthScore,
          healthStatus: healthScore >= 80 ? 'excellent' :
                       healthScore >= 60 ? 'good' :
                       healthScore >= 40 ? 'fair' : 'poor'
        },
        routers: routerDetails,
        statistics: stats,
        recommendations: this.generateRecommendationsText(config, providers, stats)
      };

      const jsonString = pretty ?
        JSON.stringify(exportData, null, 2) :
        JSON.stringify(exportData);

      console.log(jsonString);

    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * 构建路由详情
   * @param routerConfig 路由配置
   * @param providers 提供商列表
   * @returns RouteDetails[] 路由详情数组
   */
  private static buildRouterDetails(
    routerConfig: CCRConfig['Router'],
    providers: Provider[]
  ): RouteDetails[] {
    const details: RouteDetails[] = [];
    const routerTypes = ['default', 'background', 'think', 'longContext', 'webSearch'];

    routerTypes.forEach(type => {
      const routeValue = routerConfig[type as keyof typeof routerConfig];

      if (routeValue) {
        const validation = ValidatorService.validateRouterConfig(routeValue);
        let status = 'active';
        let isDeprecated = false;
        let isModelAvailable = false;

        if (validation.isValid && validation.providerName) {
          const provider = providers.find(p => p.name === validation.providerName);
          isDeprecated = provider?.deprecated || false;
          isModelAvailable = provider && ValidatorService.modelExists(provider, validation.modelName!);

          if (isDeprecated) {
            status = 'deprecated';
          } else if (!isModelAvailable) {
            status = 'unknown_model';
          }
        } else {
          status = 'error';
        }

        details.push({
          type,
          provider: validation.providerName || 'unknown',
          model: validation.modelName || 'unknown',
          status,
          isValid: validation.isValid,
          isDeprecated,
          isModelAvailable
        });
      } else {
        details.push({
          type,
          provider: '',
          model: '',
          status: 'not_configured',
          isValid: false,
          isDeprecated: false,
          isModelAvailable: false
        });
      }
    });

    return details;
  }

  /**
   * 生成建议文本
   * @param config 配置对象
   * @param providers 提供商列表
   * @param stats 统计信息
   * @returns string[] 建议文本数组
   */
  private static generateRecommendationsText(
    config: CCRConfig,
    providers: Provider[],
    stats: RouteStatistics
  ): string[] {
    const recommendations: string[] = [];

    if (stats.configuredRouters < stats.totalRouters) {
      recommendations.push('Configure all router types for complete functionality');
    }

    if (stats.deprecatedProviders > 0) {
      recommendations.push('Replace deprecated providers for better stability');
    }

    if (stats.unknownModels > 0) {
      recommendations.push('Update unknown model configurations');
    }

    return recommendations;
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