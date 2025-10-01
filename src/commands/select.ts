import inquirer from 'inquirer';
import { ConfigService } from '../services/config';
import { CCRService } from '../services/ccr';
import { FormatUtils } from '../utils/format';
import { RouterType, UI_MESSAGES, VALIDATION_MESSAGES, ERROR_MESSAGES } from '../utils/constants';
import { Provider } from '../types';

/**
 * 选择结果接口
 */
interface SelectionResult {
  selectedProvider: string;
  selectedModel: string;
  selectedRoutes: RouterType[];
}

/**
 * 提供商选择选项接口
 */
interface ProviderChoice {
  name: string;
  value: string;
  models: string[];
}

/**
 * Select命令实现
 */
export class SelectCommand {
  /**
   * 执行select命令
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

      FormatUtils.showSuccess('找到以下模型提供商:');

      // 执行选择流程
      const selection = await this.performSelection(providers, config);

      if (!selection) {
        FormatUtils.showError(VALIDATION_MESSAGES.PROVIDER_SELECT_ERROR);
        return;
      }

      // 更新配置
      await this.updateConfig(config, selection);

      // 重启CCR
      await CCRService.restart();

      FormatUtils.showSuccess(UI_MESSAGES.OPERATION_COMPLETE);

    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * 执行选择流程
   * @param providers 提供商列表
   * @param config 配置对象
   * @returns Promise<SelectionResult | null> 选择结果
   */
  private static async performSelection(
    providers: Provider[],
    config: any
  ): Promise<SelectionResult | null> {
    // 第一步：选择提供商
    const selectedProvider = await this.selectProvider(providers);
    if (!selectedProvider) return null;

    // 第二步：选择模型
    const selectedModel = await this.selectModel(selectedProvider);
    if (!selectedModel) return null;

    // 第三步：选择路由模式
    const selectedRoutes = await this.selectRoutes(config);
    if (!selectedRoutes) return null;

    return {
      selectedProvider: selectedProvider.name,
      selectedModel,
      selectedRoutes
    };
  }

  /**
   * 选择提供商
   * @param providers 提供商列表
   * @returns Promise<ProviderChoice | null> 选择的提供商
   */
  private static async selectProvider(providers: Provider[]): Promise<ProviderChoice | null> {
    const choices: ProviderChoice[] = providers
      .filter(provider => provider.models && provider.models.length > 0)
      .map(provider => ({
        name: provider.name,
        value: provider.name,
        models: provider.models!
      }));

    if (choices.length === 0) {
      FormatUtils.showError(ERROR_MESSAGES.NO_MODELS);
      return null;
    }

    const { selectedProvider } = await inquirer.prompt([
      {
        type: 'list',
        name: 'selectedProvider',
        message: UI_MESSAGES.PROVIDER_SELECTION,
        choices: choices.map(choice => ({
          name: choice.name,
          value: choice.value
        }))
      }
    ]);

    return choices.find(choice => choice.value === selectedProvider) || null;
  }

  /**
   * 选择模型
   * @param providerChoice 提供商选择
   * @returns Promise<string | null> 选择的模型
   */
  private static async selectModel(providerChoice: ProviderChoice): Promise<string | null> {
    const { selectedModel } = await inquirer.prompt([
      {
        type: 'list',
        name: 'selectedModel',
        message: UI_MESSAGES.MODEL_SELECTION.replace('{provider}', providerChoice.name),
        choices: providerChoice.models.map(model => ({
          name: model,
          value: model
        }))
      }
    ]);

    FormatUtils.showInfo(`您选择了: ${providerChoice.name} - ${selectedModel}`);
    return selectedModel;
  }

  /**
   * 选择路由模式
   * @param config 配置对象
   * @returns Promise<RouterType[] | null> 选择的路由模式数组
   */
  private static async selectRoutes(config: any): Promise<RouterType[] | null> {
    const routeOptions = FormatUtils.createRouteOptions(config);

    const { selectedRoutes } = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'selectedRoutes',
        message: UI_MESSAGES.ROUTE_SELECTION,
        choices: routeOptions,
        validate: (answers: string[]) => {
          if (answers.length === 0) {
            return VALIDATION_MESSAGES.AT_LEAST_ONE_ROUTE;
          }
          return true;
        }
      }
    ]);

    return selectedRoutes as RouterType[];
  }

  /**
   * 更新配置
   * @param config 原配置
   * @param selection 选择结果
   */
  private static async updateConfig(config: any, selection: SelectionResult): Promise<void> {
    // 创建更新后的配置
    const updatedConfig = {
      ...config,
      Router: {
        ...config.Router
      }
    };

    // 为每个选定的路由设置新的提供商和模型
    const modelConfig = `${selection.selectedProvider},${selection.selectedModel}`;
    selection.selectedRoutes.forEach((route: RouterType) => {
      updatedConfig.Router[route] = modelConfig;
    });

    // 保存配置
    await ConfigService.updateConfig(updatedConfig);
    FormatUtils.showSuccess(UI_MESSAGES.CONFIG_UPDATED);
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