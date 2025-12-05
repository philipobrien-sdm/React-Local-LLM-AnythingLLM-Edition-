import React, { useState, useEffect } from 'react';
import { Settings, Server, Play, AlertCircle, CheckCircle2, Terminal, MessageSquare, Loader2, Globe, Code, Book, Feather, Smile, Key, Eye, EyeOff, Layout, Database, Activity, Zap, Trash2, Plus } from 'lucide-react';
import { AppConfig, ConnectionStatus, AnythingLLMWorkspace } from './types';
import { DEFAULT_HOST, DEFAULT_OLLAMA_PORT, DEFAULT_ANYTHINGLLM_PORT, DEFAULT_MODEL, PROMPT_PRESETS, DEFAULT_PROVIDER, DEFAULT_API_KEY } from './constants';
import * as ollamaService from './services/ollama';
import { AnythingLLMClient, SDK_METHODS } from './services/anythingllm-sdk';

// Icon mapping helper
const getIcon = (iconName: string, className: string) => {
  switch (iconName) {
    case 'smile': return <Smile className={className} />;
    case 'feather': return <Feather className={className} />;
    case 'book': return <Book className={className} />;
    case 'code': return <Code className={className} />;
    case 'globe': return <Globe className={className} />;
    default: return <MessageSquare className={className} />;
  }
};

const App: React.FC = () => {
  // Configuration State
  const [config, setConfig] = useState<AppConfig>({
    provider: DEFAULT_PROVIDER,
    host: DEFAULT_HOST,
    port: DEFAULT_ANYTHINGLLM_PORT,
    model: DEFAULT_MODEL,
    apiKey: DEFAULT_API_KEY,
  });

  // App State
  const [status, setStatus] = useState<ConnectionStatus>('idle');
  const [response, setResponse] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPromptId, setSelectedPromptId] = useState<string | null>(null);
  const [showApiKey, setShowApiKey] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(true);

  // AnythingLLM Specific State
  const [availableWorkspaces, setAvailableWorkspaces] = useState<AnythingLLMWorkspace[]>([]);
  
  // API Playground State
  const [selectedMethodIdx, setSelectedMethodIdx] = useState<number>(0);
  const [methodArgs, setMethodArgs] = useState<Record<string, any>>({});
  const [apiResult, setApiResult] = useState<string | null>(null);

  // Update default port when provider changes
  useEffect(() => {
    setConfig(prev => ({
      ...prev,
      port: prev.provider === 'ollama' ? DEFAULT_OLLAMA_PORT : DEFAULT_ANYTHINGLLM_PORT,
      model: prev.provider === 'ollama' ? 'llama3' : DEFAULT_MODEL
    }));
    setStatus('idle');
    setError(null);
    setAvailableWorkspaces([]);
    setApiResult(null);
  }, [config.provider]);

  // Pre-fill method arguments when method or config changes
  useEffect(() => {
    const definition = SDK_METHODS[selectedMethodIdx];
    const initialArgs: Record<string, any> = {};
    
    definition.params.forEach(param => {
      if (param.type === 'slug' && config.model) {
        initialArgs[param.name] = config.model;
      } else if (param.defaultValue !== undefined) {
        initialArgs[param.name] = param.defaultValue;
      } else {
        initialArgs[param.name] = '';
      }
    });
    setMethodArgs(initialArgs);
    setApiResult(null);
  }, [selectedMethodIdx, config.model]);

  const handleConfigChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setConfig(prev => ({ ...prev, [name]: value }));
    setStatus('idle');
    if (name === 'apiKey' || name === 'model') setError(null);
  };

  const checkConnection = async () => {
    setStatus('checking');
    setError(null);

    try {
      if (config.provider === 'ollama') {
        const result = await ollamaService.checkConnection(config);
        if (result.success) {
          setStatus('connected');
          setIsSettingsOpen(false);
        } else {
          throw new Error(result.error);
        }
      } else {
        // AnythingLLM Connection Check
        const client = new AnythingLLMClient(config.host, config.port, config.apiKey || '');
        const result = await client.validateConnection();
        
        if (result.authenticated) {
          setStatus('connected');
          fetchWorkspaces(client);
          setIsSettingsOpen(false);
        } else {
          throw new Error(result.error);
        }
      }
    } catch (err: any) {
      setStatus('error');
      setError(err.message || "Connection failed");
    }
  };

  const fetchWorkspaces = async (client?: AnythingLLMClient) => {
    try {
      const sdk = client || new AnythingLLMClient(config.host, config.port, config.apiKey || '');
      const workspaces = await sdk.getWorkspaces();
      setAvailableWorkspaces(workspaces);
    } catch (e: any) {
      console.error("Failed to fetch workspaces", e);
    }
  };

  const handlePromptClick = async (promptId: string, promptText: string) => {
    if (status === 'error') {
       setError("Please fix connection settings first.");
       return;
    }

    if (config.provider === 'anythingllm' && !config.apiKey?.trim()) {
       setError("API Key is required for AnythingLLM.");
       setIsSettingsOpen(true);
       return;
    }

    setSelectedPromptId(promptId);
    setIsLoading(true);
    setResponse(null);
    setError(null);
    setApiResult(null);

    try {
      if (config.provider === 'ollama') {
        const result = await ollamaService.generateResponse(config, promptText);
        setResponse(result.response);
      } else {
        const client = new AnythingLLMClient(config.host, config.port, config.apiKey || '');
        const result = await client.sendChat(config.model, promptText);
        setResponse(result.textResponse);
        if (result.sources.length > 0) {
          setApiResult(JSON.stringify({ sources: result.sources }, null, 2));
        }
      }
      setStatus('connected'); 
    } catch (err: any) {
      console.error(err);
      setStatus('error');
      setError(`Failed to generate response. ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const executeApiMethod = async () => {
    const definition = SDK_METHODS[selectedMethodIdx];
    const client = new AnythingLLMClient(config.host, config.port, config.apiKey || '');
    
    setApiResult("Executing...");
    try {
      // @ts-ignore - dynamic method call
      const fn = client[definition.method];
      if (typeof fn !== 'function') throw new Error("Method not implemented in SDK");

      const args = definition.params.map(p => methodArgs[p.name]);
      const result = await fn.apply(client, args);
      setApiResult(JSON.stringify(result, null, 2));
      
      // Refresh workspaces if we just created/deleted one
      if (definition.method.includes('Workspace')) {
        fetchWorkspaces(client);
      }
    } catch (e: any) {
      setApiResult(`Error: ${e.message}`);
    }
  };

  const selectWorkspace = (slug: string) => {
    setConfig(prev => ({ ...prev, model: slug }));
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg text-white transition-colors ${config.provider === 'ollama' ? 'bg-orange-500' : 'bg-blue-600'}`}>
              <Terminal size={20} />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-800">
              React - Local LLM <span className="text-slate-400 font-normal text-sm ml-2">v2</span>
            </h1>
          </div>
          
          <button 
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              isSettingsOpen 
                ? 'bg-slate-100 text-slate-900 ring-1 ring-slate-200' 
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            <Settings size={16} />
            <span>Config</span>
            {status === 'connected' && <span className="w-2 h-2 rounded-full bg-green-500 ml-1"></span>}
            {status === 'error' && <span className="w-2 h-2 rounded-full bg-red-500 ml-1"></span>}
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Settings Panel */}
        {isSettingsOpen && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h2 className="font-semibold text-slate-800 flex items-center space-x-2">
                <Server size={18} className="text-slate-500" />
                <span>Connection Settings</span>
              </h2>
            </div>
            
            <div className="p-6 grid gap-6 md:grid-cols-2 lg:grid-cols-12">
              
              {/* Provider Selection */}
              <div className="lg:col-span-12 mb-2">
                <label className="text-sm font-medium text-slate-700 block mb-2">LLM Provider</label>
                <div className="flex space-x-4">
                  <label className={`flex items-center space-x-2 px-4 py-2 rounded-lg border cursor-pointer transition-all ${config.provider === 'ollama' ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-slate-200 hover:bg-slate-50'}`}>
                    <input 
                      type="radio" 
                      name="provider" 
                      value="ollama" 
                      checked={config.provider === 'ollama'} 
                      onChange={handleConfigChange}
                      className="hidden" 
                    />
                    <div className="w-4 h-4 rounded-full border border-current flex items-center justify-center">
                      {config.provider === 'ollama' && <div className="w-2 h-2 rounded-full bg-current" />}
                    </div>
                    <span>Ollama</span>
                  </label>
                  
                  <label className={`flex items-center space-x-2 px-4 py-2 rounded-lg border cursor-pointer transition-all ${config.provider === 'anythingllm' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 hover:bg-slate-50'}`}>
                    <input 
                      type="radio" 
                      name="provider" 
                      value="anythingllm" 
                      checked={config.provider === 'anythingllm'} 
                      onChange={handleConfigChange}
                      className="hidden" 
                    />
                    <div className="w-4 h-4 rounded-full border border-current flex items-center justify-center">
                      {config.provider === 'anythingllm' && <div className="w-2 h-2 rounded-full bg-current" />}
                    </div>
                    <span>AnythingLLM</span>
                  </label>
                </div>
              </div>

              <div className="lg:col-span-4 space-y-2">
                <label className="text-sm font-medium text-slate-700">Server Host</label>
                <input 
                  type="text" 
                  name="host"
                  value={config.host}
                  onChange={handleConfigChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-400 outline-none transition-all text-slate-800 placeholder-slate-400 font-mono text-sm"
                  placeholder="http://localhost"
                />
              </div>
              
              <div className="lg:col-span-2 space-y-2">
                <label className="text-sm font-medium text-slate-700">Port</label>
                <input 
                  type="text" 
                  name="port"
                  value={config.port}
                  onChange={handleConfigChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-400 outline-none transition-all text-slate-800 placeholder-slate-400 font-mono text-sm"
                  placeholder={config.provider === 'ollama' ? "11434" : "3001"}
                />
              </div>

              <div className="lg:col-span-3 space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  {config.provider === 'anythingllm' ? 'Workspace Slug' : 'Model Name'}
                </label>
                <input 
                  type="text" 
                  name="model"
                  value={config.model}
                  onChange={handleConfigChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-400 outline-none transition-all text-slate-800 placeholder-slate-400 font-mono text-sm"
                  placeholder={config.provider === 'ollama' ? "llama3" : "my-workspace-slug"}
                />
              </div>

              <div className="lg:col-span-3 flex items-end">
                <button 
                  onClick={checkConnection}
                  disabled={status === 'checking'}
                  className={`w-full flex items-center justify-center space-x-2 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed h-[42px] ${
                    config.provider === 'ollama' ? 'bg-orange-600 hover:bg-orange-700' : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {status === 'checking' ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Play size={16} fill="currentColor" />
                  )}
                  <span>Test Connection</span>
                </button>
              </div>

              {config.provider === 'anythingllm' && (
                <div className="lg:col-span-12 space-y-2 animate-in fade-in slide-in-from-top-2">
                  <label className="text-sm font-medium text-slate-700 flex items-center">
                    <Key size={14} className="mr-1" /> API Key (Required)
                  </label>
                  <div className="relative">
                    <input 
                      type={showApiKey ? "text" : "password"}
                      name="apiKey"
                      value={config.apiKey}
                      onChange={handleConfigChange}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all text-slate-800 placeholder-slate-400 font-mono text-sm pr-10"
                      placeholder="Enter your AnythingLLM API Key"
                    />
                    <button 
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <p className="text-xs text-slate-500">Found in AnythingLLM Desktop: Settings &gt; Developer API.</p>
                </div>
              )}
            </div>

            {/* Status Bar */}
            <div className={`px-6 py-3 text-sm flex items-start space-x-3 border-t ${
                status === 'error' ? 'bg-red-50 text-red-700 border-red-100' :
                status === 'connected' ? 'bg-green-50 text-green-700 border-green-100' :
                'bg-slate-50 text-slate-600 border-slate-100'
              }`}>
              {status === 'error' && <AlertCircle className="mt-0.5 shrink-0" size={16} />}
              {status === 'connected' && <CheckCircle2 className="mt-0.5 shrink-0" size={16} />}
              {status === 'idle' && <AlertCircle className="mt-0.5 shrink-0 text-slate-400" size={16} />}
              
              <div className="flex-1">
                {status === 'error' && <p className="font-medium">{error || 'Connection Failed'}</p>}
                {status === 'connected' && <p className="font-medium">Connected to {config.host}:{config.port} ({config.provider})</p>}
                {status === 'idle' && <p>Select provider, enter details, and test connection.</p>}
              </div>
            </div>
          </div>
        )}

        {/* AnythingLLM API Explorer */}
        {config.provider === 'anythingllm' && status === 'connected' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in slide-in-from-bottom-4">
             {/* Left: Workspaces */}
             <div className="lg:col-span-3 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                  <h3 className="text-sm font-semibold text-slate-800 flex items-center">
                    <Database size={16} className="mr-2 text-blue-500" />
                    Available Workspaces
                  </h3>
                </div>
                <div className="p-2 overflow-y-auto max-h-[400px]">
                {availableWorkspaces.length === 0 ? (
                  <div className="text-center py-6 text-slate-400 text-xs">
                    <p>No workspaces found.</p>
                    <button onClick={() => fetchWorkspaces()} className="mt-2 text-blue-600 hover:underline">Retry</button>
                  </div>
                ) : (
                  <ul className="space-y-1">
                    {availableWorkspaces.map(ws => (
                      <li key={ws.id}>
                        <button 
                          onClick={() => selectWorkspace(ws.slug)}
                          className={`w-full text-left px-3 py-2 rounded-md text-xs transition-colors flex items-center justify-between group ${
                            config.model === ws.slug 
                            ? 'bg-blue-50 text-blue-700 font-medium ring-1 ring-blue-200' 
                            : 'hover:bg-slate-50 text-slate-600'
                          }`}
                        >
                          <span className="truncate">{ws.name}</span>
                          {config.model === ws.slug && <CheckCircle2 size={12} />}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                </div>
             </div>

             {/* Center: Method Playground */}
             <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
               <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                  <h3 className="text-sm font-semibold text-slate-800 flex items-center">
                    <Zap size={16} className="mr-2 text-yellow-500" />
                    API Playground
                  </h3>
               </div>
               
               <div className="p-5 space-y-4">
                  {/* Method Selector */}
                  <div>
                    <label className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1 block">SDK Method</label>
                    <select 
                      value={selectedMethodIdx}
                      onChange={(e) => setSelectedMethodIdx(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      {SDK_METHODS.map((m, idx) => (
                        <option key={m.method} value={idx}>{m.label}</option>
                      ))}
                    </select>
                    <p className="text-xs text-slate-400 mt-1">{SDK_METHODS[selectedMethodIdx].description}</p>
                  </div>

                  {/* Dynamic Arguments Form */}
                  <div className="space-y-3 bg-slate-50 p-4 rounded-lg border border-slate-100">
                    {SDK_METHODS[selectedMethodIdx].params.length === 0 && (
                      <p className="text-xs text-slate-400 italic">No arguments required.</p>
                    )}
                    {SDK_METHODS[selectedMethodIdx].params.map(param => (
                      <div key={param.name}>
                        <label className="text-xs font-medium text-slate-700 mb-1 block flex justify-between">
                          <span>{param.name} <span className="text-slate-400 font-normal">({param.type})</span></span>
                          {param.required && <span className="text-red-400">*</span>}
                        </label>
                        {param.description && <p className="text-[10px] text-slate-400 mb-1">{param.description}</p>}
                        
                        {/* Render Input based on type */}
                        {param.type === 'slug' && config.model ? (
                          <div className="flex gap-2">
                             <input 
                              type="text"
                              value={methodArgs[param.name] || ''}
                              onChange={(e) => setMethodArgs(prev => ({...prev, [param.name]: e.target.value}))}
                              className="flex-1 px-3 py-1.5 border border-slate-300 rounded text-sm focus:outline-blue-500"
                            />
                            <button 
                              onClick={() => setMethodArgs(prev => ({...prev, [param.name]: config.model}))}
                              title="Use current workspace"
                              className="px-2 bg-slate-200 rounded hover:bg-slate-300 text-slate-600"
                            >
                              <Activity size={14} />
                            </button>
                          </div>
                        ) : (
                          <input 
                            type="text"
                            value={methodArgs[param.name] || ''}
                            onChange={(e) => setMethodArgs(prev => ({...prev, [param.name]: e.target.value}))}
                            placeholder={param.defaultValue}
                            className="w-full px-3 py-1.5 border border-slate-300 rounded text-sm focus:outline-blue-500"
                          />
                        )}
                      </div>
                    ))}
                  </div>

                  <button 
                    onClick={executeApiMethod}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2"
                  >
                    <Play size={14} fill="currentColor" />
                    Execute Method
                  </button>
               </div>
             </div>

             {/* Right: Output */}
             <div className="lg:col-span-4 bg-slate-900 rounded-xl border border-slate-800 shadow-sm overflow-hidden flex flex-col min-h-[300px] lg:min-h-0">
               <div className="p-3 border-b border-slate-800 bg-slate-900 flex justify-between items-center">
                  <h3 className="text-xs font-semibold text-slate-300 flex items-center">
                    <Code size={14} className="mr-2" />
                    JSON Result
                  </h3>
                  {apiResult && (
                    <button onClick={() => setApiResult(null)} className="text-xs text-slate-500 hover:text-slate-300">Clear</button>
                  )}
               </div>
               <div className="flex-1 p-3 overflow-auto font-mono text-xs text-green-400 bg-slate-950">
                  {apiResult ? (
                    <pre className="whitespace-pre-wrap break-all">{apiResult}</pre>
                  ) : (
                     <div className="h-full flex items-center justify-center text-slate-700 italic select-none">
                       Waiting for execution...
                     </div>
                  )}
               </div>
             </div>
          </div>
        )}

        {/* Prompt Selection Area */}
        <div className="pt-4 border-t border-slate-200">
          <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
            <MessageSquare className="mr-2 text-slate-400" size={20} />
            Quick Prompts
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {PROMPT_PRESETS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => handlePromptClick(preset.id, preset.text)}
                disabled={isLoading}
                className={`text-left group relative flex flex-col p-5 rounded-xl border transition-all duration-200 
                  ${selectedPromptId === preset.id 
                    ? config.provider === 'ollama' 
                        ? 'border-orange-500 bg-orange-50/50 shadow-md ring-1 ring-orange-500' 
                        : 'border-blue-500 bg-blue-50/50 shadow-md ring-1 ring-blue-500'
                    : 'border-slate-200 bg-white hover:shadow-md'
                  }
                  ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className={`p-2 rounded-lg transition-colors
                    ${selectedPromptId === preset.id 
                      ? config.provider === 'ollama' ? 'bg-white text-orange-600' : 'bg-white text-blue-600'
                      : config.provider === 'ollama'
                        ? 'bg-slate-100 text-slate-600 group-hover:bg-orange-100 group-hover:text-orange-600'
                        : 'bg-slate-100 text-slate-600 group-hover:bg-blue-100 group-hover:text-blue-600'
                    }
                  `}>
                    {getIcon(preset.icon, "w-5 h-5")}
                  </span>
                  {selectedPromptId === preset.id && isLoading && (
                    <Loader2 className={`animate-spin ${config.provider === 'ollama' ? 'text-orange-500' : 'text-blue-500'}`} size={18} />
                  )}
                </div>
                <h3 className="font-semibold text-slate-900 mb-1">{preset.title}</h3>
                <p className="text-sm text-slate-500 line-clamp-2">{preset.text}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Response Area */}
        {response && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden min-h-[200px] flex flex-col animate-in fade-in slide-in-from-bottom-2">
          <div className="bg-slate-50 px-6 py-3 border-b border-slate-100 flex items-center justify-between">
             <h3 className="font-semibold text-slate-700 text-sm uppercase tracking-wider">Response Output</h3>
             {!isLoading && (
               <span className="text-xs font-mono text-slate-400 bg-slate-100 px-2 py-1 rounded">
                 {config.provider} / {config.model}
               </span>
             )}
          </div>
          <div className="p-6 flex-1">
             <div className="prose prose-slate max-w-none">
                <p className="whitespace-pre-wrap text-slate-800 leading-relaxed font-mono text-sm">
                  {response}
                </p>
              </div>
          </div>
        </div>
        )}

      </main>
    </div>
  );
}

export default App;