export interface Provider {
  name: string;
  api_base_url: string;
  api_key: string;
  models: string[];
  deprecated?: boolean;
  transformer?: {
    use: string[];
  };
}

export interface Router {
  default: string;
  background: string;
  think: string;
  longContext: string;
  webSearch: string;
}

export interface CCRConfig {
  LOG: boolean;
  LOG_LEVEL: string;
  CLAUDE_PATH: string;
  HOST: string;
  PORT: number;
  APIKEY: string;
  API_TIMEOUT_MS: string;
  PROXY_URL: string;
  transformers: any[];
  Providers: Provider[];
  StatusLine: {
    enabled: boolean;
    currentStyle: string;
    default: {
      modules: any[];
    };
    powerline: {
      modules: any[];
    };
  };
  Router: Router;
}