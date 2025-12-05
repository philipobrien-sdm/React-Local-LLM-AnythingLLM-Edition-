export type LLMProvider = 'ollama' | 'anythingllm';

export interface AppConfig {
  provider: LLMProvider;
  host: string;
  port: string;
  model: string;
  apiKey?: string;
}

export interface LLMRequest {
  model: string;
  prompt: string;
  stream?: boolean;
}

export interface LLMResponse {
  response: string;
  created_at?: string;
  done?: boolean;
  total_duration?: number;
  // AnythingLLM specific
  sources?: any[];
  id?: string;
}

export interface PromptPreset {
  id: string;
  title: string;
  text: string;
  icon: string;
}

export type ConnectionStatus = 'idle' | 'checking' | 'connected' | 'error';

// --- AnythingLLM Specific Types ---

export interface AnythingLLMWorkspace {
  id: number;
  name: string;
  slug: string;
  vectorTag: string;
  createdAt: string;
  openAiTemp: number;
  lastUpdatedAt: string;
}

export interface AnythingLLMUser {
  id: number;
  username: string;
  role: 'default' | 'admin' | 'manager';
  createdAt: string;
}

export interface AnythingLLMSystemStatus {
  online: boolean;
  mode: 'multi-user' | 'password';
}

// --- SDK UI Generation Types ---

export type SDKParamType = 'string' | 'number' | 'boolean' | 'slug' | 'json';

export interface SDKMethodParam {
  name: string;
  type: SDKParamType;
  required: boolean;
  description?: string;
  defaultValue?: any;
}

export interface SDKMethodDefinition {
  method: string;
  label: string;
  description: string;
  params: SDKMethodParam[];
}