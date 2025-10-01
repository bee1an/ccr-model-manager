/**
 * CCR模型管理器常量定义
 */

/**
 * 路由类型枚举
 */
export enum RouterType {
  DEFAULT = 'default',
  BACKGROUND = 'background',
  THINK = 'think',
  LONG_CONTEXT = 'longContext',
  WEB_SEARCH = 'webSearch'
}

/**
 * 路由类型配置对象
 */
export const ROUTER_TYPES = [
  { type: RouterType.DEFAULT, displayName: '默认路由', description: '默认对话路由' },
  { type: RouterType.BACKGROUND, displayName: '背景路由', description: '背景任务路由' },
  { type: RouterType.THINK, displayName: '思考路由', description: '深度思考路由' },
  { type: RouterType.LONG_CONTEXT, displayName: '长上下文路由', description: '长文本处理路由' },
  { type: RouterType.WEB_SEARCH, displayName: '网页搜索路由', description: '网络搜索路由' }
];

/**
 * 状态类型枚举
 */
export enum StatusType {
  ACTIVE = 'active',
  DEPRECATED = 'deprecated',
  UNKNOWN_MODEL = 'unknown_model',
  ERROR = 'error',
  NOT_CONFIGURED = 'not_configured'
}

/**
 * 状态显示配置
 */
export const STATUS_CONFIG = {
  [StatusType.ACTIVE]: {
    text: '🟢 Active',
    color: 'green',
    description: '正常可用'
  },
  [StatusType.DEPRECATED]: {
    text: '🟡 Deprecated',
    color: 'yellow',
    description: '已弃用但可用'
  },
  [StatusType.UNKNOWN_MODEL]: {
    text: '🔴 未知模型',
    color: 'red',
    description: '模型不在提供商列表中'
  },
  [StatusType.ERROR]: {
    text: '🔴 错误',
    color: 'red',
    description: '配置错误'
  },
  [StatusType.NOT_CONFIGURED]: {
    text: '未配置',
    color: 'red',
    description: '未配置路由'
  }
};

/**
 * 表格格式化常量
 */
export const TABLE_FORMAT = {
  HEADER: '┌─────────────┬────────────────────────────┬─────────────────────┬──────────────┐',
  SEPARATOR: '├─────────────┼────────────────────────────┼─────────────────────┼──────────────┤',
  FOOTER: '└─────────────┴────────────────────────────┴─────────────────────┴──────────────┘',
  HEADERS: '│ Router Type │ Provider                  │ Model               │ Status       │',
  COLUMN_WIDTHS: {
    routerType: 11,
    provider: 28,
    model: 19,
    status: 12
  }
};

/**
 * 系统命令常量
 */
export const SYSTEM_COMMANDS = {
  CCR_RESTART: 'ccr restart'
};

/**
 * 错误消息常量
 */
export const ERROR_MESSAGES = {
  CONFIG_NOT_FOUND: 'CCR配置文件不存在，请确保CCR已正确安装并配置',
  CONFIG_READ_ERROR: '读取配置文件失败',
  CONFIG_WRITE_ERROR: '更新配置文件失败',
  NO_PROVIDERS: '未找到任何模型提供商配置',
  NO_MODELS: '未找到任何模型配置',
  NO_ROUTER_CONFIG: '未找到Router配置',
  PROVIDER_NOT_FOUND: '提供商不存在',
  INVALID_FORMAT: '配置格式错误',
  RESTART_FAILED: '无法自动重启CCR，请手动重启'
};

/**
 * 用户界面消息常量
 */
export const UI_MESSAGES = {
  READING_CONFIG: '正在读取CCR配置文件...',
  CONFIG_UPDATED: '配置文件已更新',
  RESTARTING_CCR: '正在重启CCR...',
  CCR_RESTARTED: 'CCR已重新启动',
  OPERATION_COMPLETE: '操作完成!',
  PROVIDER_SELECTION: '请选择模型提供商:',
  MODEL_SELECTION: '请选择{provider}的模型ID:',
  ROUTE_SELECTION: '请选择要更新的路由模式（可多选）:',
  CURRENT_CCR_ROUTER_CONFIG: '当前 CCR Router 配置',
  AVAILABLE_PROVIDERS: '可用的模型提供商和模型ID:',
  CURRENT_SELECTION: '当前选择: {provider} - {model}'
};

/**
 * 交互验证消息
 */
export const VALIDATION_MESSAGES = {
  AT_LEAST_ONE_ROUTE: '请至少选择一个路由模式',
  PROVIDER_SELECT_ERROR: '选择提供商时出错'
};

/**
 * 正则表达式常量
 */
export const REGEX_PATTERNS = {
  PROVIDER_MODEL: /^([^,]+),(.+)$/,  // 匹配 "provider,model" 格式
  MODEL_NAME: /^[a-zA-Z0-9_-]+\/?[a-zA-Z0-9_.-]*$/  // 匹配模型名称格式
};