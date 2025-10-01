import { CCRConfig, Provider } from '../types';
import { RouterType, REGEX_PATTERNS, ERROR_MESSAGES } from '../utils/constants';

/**
 * 验证结果接口
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * 路由配置验证接口
 */
export interface RouterConfigValidation {
  isValid: boolean;
  providerName?: string;
  modelName?: string;
  error?: string;
}

/**
 * 配置验证服务
 */
export class ValidatorService {
  /**
   * 验证CCR配置的完整性
   * @param config CCR配置对象
   * @returns ValidationResult 验证结果
   */
  static validateConfig(config: CCRConfig): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: []
    };

    // 验证必要的配置项
    if (!config.Providers || !Array.isArray(config.Providers)) {
      result.errors.push('缺少Providers配置或格式不正确');
      result.isValid = false;
    }

    if (!config.Router) {
      result.errors.push('缺少Router配置');
      result.isValid = false;
    }

    // 验证Providers
    if (config.Providers) {
      this.validateProviders(config.Providers, result);
    }

    // 验证Router
    if (config.Router) {
      this.validateRouter(config.Router, result);
    }

    return result;
  }

  /**
   * 验证提供商配置
   * @param providers 提供商列表
   * @param result 验证结果对象
   */
  private static validateProviders(providers: Provider[], result: ValidationResult): void {
    providers.forEach((provider, index) => {
      const providerPrefix = `Providers[${index}]`;

      // 验证必要字段
      if (!provider.name) {
        result.errors.push(`${providerPrefix}: 缺少name字段`);
        result.isValid = false;
      }

      if (!provider.api_base_url) {
        result.errors.push(`${providerPrefix}: 缺少api_base_url字段`);
        result.isValid = false;
      }

      if (!provider.api_key) {
        result.errors.push(`${providerPrefix}: 缺少api_key字段`);
        result.isValid = false;
      }

      if (!provider.models || !Array.isArray(provider.models)) {
        result.errors.push(`${providerPrefix}: 缺少models字段或格式不正确`);
        result.isValid = false;
      }

      // 验证models不为空
      if (provider.models && provider.models.length === 0) {
        result.warnings.push(`${providerPrefix}: models列表为空`);
      }

      // 验证是否有重复的提供商名称
      const duplicateNames = providers.filter((p, i) =>
        p.name === provider.name && i !== index
      );
      if (duplicateNames.length > 0) {
        result.errors.push(`${providerPrefix}: 提供商名称 '${provider.name}' 重复`);
        result.isValid = false;
      }
    });

    // 检查是否至少有一个活跃的提供商
    const activeProviders = providers.filter(p => !p.deprecated);
    if (activeProviders.length === 0) {
      result.warnings.push('没有活跃的提供商（所有提供商都已弃用）');
    }
  }

  /**
   * 验证路由配置
   * @param router 路由配置
   * @param result 验证结果对象
   */
  private static validateRouter(router: CCRConfig['Router'], result: ValidationResult): void {
    const requiredRoutes = [
      RouterType.DEFAULT,
      RouterType.BACKGROUND,
      RouterType.THINK,
      RouterType.LONG_CONTEXT,
      RouterType.WEB_SEARCH
    ];

    requiredRoutes.forEach(routeType => {
      const routeValue = router[routeType];

      if (!routeValue) {
        result.warnings.push(`Router.${routeType}: 未配置`);
        return;
      }

      // 验证路由配置格式
      const validation = this.validateRouterConfig(routeValue);
      if (!validation.isValid) {
        result.errors.push(`Router.${routeType}: ${validation.error}`);
        result.isValid = false;
      }
    });
  }

  /**
   * 验证单个路由配置格式
   * @param config 路由配置字符串
   * @returns RouterConfigValidation 验证结果
   */
  static validateRouterConfig(config: string): RouterConfigValidation {
    const result: RouterConfigValidation = {
      isValid: false
    };

    // 使用正则表达式解析 "provider,model" 格式
    const match = config.match(REGEX_PATTERNS.PROVIDER_MODEL);

    if (!match) {
      result.error = '配置格式错误，应为 "provider,model" 格式';
      return result;
    }

    const [, providerName, modelName] = match;

    if (!providerName || !modelName) {
      result.error = '提供商名称和模型名称不能为空';
      return result;
    }

    result.isValid = true;
    result.providerName = providerName;
    result.modelName = modelName;

    return result;
  }

  /**
   * 检查提供商是否存在
   * @param providers 提供商列表
   * @param providerName 提供商名称
   * @returns boolean 是否存在
   */
  static providerExists(providers: Provider[], providerName: string): boolean {
    return providers.some(provider => provider.name === providerName);
  }

  /**
   * 检查模型是否在提供商的模型列表中
   * @param provider 提供商对象
   * @param modelName 模型名称
   * @returns boolean 是否存在
   */
  static modelExists(provider: Provider, modelName: string): boolean {
    return provider.models && provider.models.includes(modelName);
  }

  /**
   * 获取提供商状态
   * @param provider 提供商对象
   * @returns string 状态描述
   */
  static getProviderStatus(provider: Provider): string {
    if (provider.deprecated) {
      return 'deprecated';
    }
    return 'active';
  }

  /**
   * 检查路由配置的完整性和有效性
   * @param config CCR配置
   * @param providers 提供商列表
   * @returns Map<RouterType, RouterConfigValidation> 每个路由的验证结果
   */
  static validateAllRouterConfigs(
    config: CCRConfig,
    providers: Provider[]
  ): Map<RouterType, RouterConfigValidation> {
    const results = new Map<RouterType, RouterConfigValidation>();

    if (!config.Router) {
      return results;
    }

    const routerTypes = [
      RouterType.DEFAULT,
      RouterType.BACKGROUND,
      RouterType.THINK,
      RouterType.LONG_CONTEXT,
      RouterType.WEB_SEARCH
    ];

    routerTypes.forEach(routeType => {
      const routeValue = config.Router[routeType];

      if (!routeValue) {
        results.set(routeType, {
          isValid: false,
          error: '未配置'
        });
        return;
      }

      // 验证格式
      const formatValidation = this.validateRouterConfig(routeValue);
      if (!formatValidation.isValid) {
        results.set(routeType, formatValidation);
        return;
      }

      // 验证提供商存在性
      if (!formatValidation.providerName || !formatValidation.modelName) {
        results.set(routeType, {
          isValid: false,
          error: '解析失败'
        });
        return;
      }

      const provider = providers.find(p => p.name === formatValidation.providerName);
      if (!provider) {
        results.set(routeType, {
          isValid: false,
          providerName: formatValidation.providerName,
          modelName: formatValidation.modelName,
          error: '提供商不存在'
        });
        return;
      }

      // 验证模型存在性
      if (!this.modelExists(provider, formatValidation.modelName)) {
        results.set(routeType, {
          isValid: false,
          providerName: formatValidation.providerName,
          modelName: formatValidation.modelName,
          error: '模型不存在'
        });
        return;
      }

      // 验证通过
      results.set(routeType, {
        isValid: true,
        providerName: formatValidation.providerName,
        modelName: formatValidation.modelName
      });
    });

    return results;
  }

  /**
   * 生成用户友好的错误信息
   * @param validationResults 验证结果映射
   * @returns string[] 错误信息数组
   */
  static generateErrorMessages(validationResults: Map<RouterType, RouterConfigValidation>): string[] {
    const messages: string[] = [];

    validationResults.forEach((validation, routeType) => {
      if (!validation.isValid && validation.error) {
        messages.push(`${routeType}: ${validation.error}`);
      }
    });

    return messages;
  }

  /**
   * 快速验证配置是否可用
   * @param config CCR配置
   * @returns boolean 是否可用
   */
  static isConfigUsable(config: CCRConfig): boolean {
    const validation = this.validateConfig(config);
    return validation.isValid && validation.errors.length === 0;
  }
}