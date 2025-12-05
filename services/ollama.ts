import { AppConfig, LLMResponse } from '../types';

/**
 * Checks if the Ollama server is reachable.
 */
export const checkConnection = async (config: AppConfig): Promise<{ success: boolean; error?: string }> => {
  const baseUrl = `${config.host}:${config.port}`;
  
  try {
    // We strictly check Ollama root which returns 200 OK "Ollama is running"
    const response = await fetch(baseUrl, { method: 'GET' });
    if (!response.ok) {
        return { success: false, error: `Server returned ${response.status} ${response.statusText}` };
    }
    return { success: true };
  } catch (e: any) {
    const msg = e.message || "Unknown error";
    if (msg.includes("Failed to fetch") || msg.includes("NetworkError")) {
        return { 
        success: false, 
        error: "Network Error. If Ollama is running, this is a CORS issue. Please restart Ollama with OLLAMA_ORIGINS=\"*\"" 
        };
    }
    return { success: false, error: msg };
  }
};

/**
 * Sends a prompt to Ollama
 */
export const generateResponse = async (
  config: AppConfig,
  prompt: string
): Promise<LLMResponse> => {
  const baseUrl = `${config.host}:${config.port}`;
  const url = `${baseUrl}/api/generate`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: config.model,
        prompt: prompt,
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return {
      response: data.response,
      created_at: data.created_at,
      done: data.done,
      total_duration: data.total_duration
    };
  } catch (error: any) {
    console.error("Ollama generation failed:", error);
    if (error.message && (error.message.includes("Failed to fetch") || error.message.includes("NetworkError"))) {
        throw new Error("Network/CORS Error. Please restart Ollama with environment variable OLLAMA_ORIGINS=\"*\"");
    }
    throw error;
  }
};