import { AnythingLLMWorkspace, AnythingLLMUser, SDKMethodDefinition } from "../types";

/**
 * AnythingLLM Client SDK
 * 
 * A comprehensive standalone library to interact with the AnythingLLM Developer API.
 * Supports Workspace management, Chat, System administration, and Document handling.
 * 
 * @see https://github.com/Mintplex-Labs/anything-llm/tree/master/server/swagger/definitions
 */
export class AnythingLLMClient {
  private baseUrl: string;
  private apiKey: string;

  /**
   * Initialize the client
   * @param host The base host (e.g. http://localhost)
   * @param port The port number (e.g. 3001)
   * @param apiKey The Developer API Key found in AnythingLLM settings
   */
  constructor(host: string, port: string, apiKey: string) {
    // Ensure no trailing slash on host, build full base URL
    const cleanHost = host.replace(/\/$/, '');
    this.baseUrl = `${cleanHost}:${port}/api/v1`;
    this.apiKey = apiKey.trim();
  }

  /**
   * Construct headers for requests
   */
  private get headers(): HeadersInit {
    return {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
  }

  // --- Core / Auth ---

  /**
   * Test the connection and authentication.
   */
  async validateConnection(): Promise<{ authenticated: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/auth`, {
        method: 'GET',
        headers: this.headers
      });

      if (response.status === 200) {
        return { authenticated: true };
      }

      if (response.status === 401 || response.status === 403) {
        return { authenticated: false, error: 'Invalid API Key' };
      }

      return { authenticated: false, error: `Server returned ${response.status} ${response.statusText}` };
    } catch (error: any) {
      return { authenticated: false, error: error.message || 'Network Error' };
    }
  }

  // --- Workspace Management ---

  /**
   * Fetch all workspaces available in the AnythingLLM instance.
   */
  async getWorkspaces(): Promise<AnythingLLMWorkspace[]> {
    const response = await fetch(`${this.baseUrl}/workspaces`, {
      method: 'GET',
      headers: this.headers
    });
    if (!response.ok) throw new Error(response.statusText);
    const data = await response.json();
    return data.workspaces || [];
  }

  /**
   * Get details for a specific workspace by slug
   */
  async getWorkspace(slug: string): Promise<AnythingLLMWorkspace> {
    const response = await fetch(`${this.baseUrl}/workspace/${slug}`, {
      method: 'GET',
      headers: this.headers
    });
    if (!response.ok) throw new Error(`Workspace '${slug}' not found or error.`);
    const data = await response.json();
    return data.workspace;
  }

  /**
   * Create a new workspace
   * @param name The display name of the workspace
   */
  async createWorkspace(name: string): Promise<AnythingLLMWorkspace> {
    const response = await fetch(`${this.baseUrl}/workspace/new`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({ name })
    });
    if (!response.ok) throw new Error(`Failed to create workspace: ${await response.text()}`);
    const data = await response.json();
    return data.workspace;
  }

  /**
   * Delete a workspace
   * @param slug The slug of the workspace to delete
   */
  async deleteWorkspace(slug: string): Promise<{ success: boolean; message?: string }> {
    const response = await fetch(`${this.baseUrl}/workspace/${slug}`, {
      method: 'DELETE',
      headers: this.headers
    });
    if (!response.ok) throw new Error(`Failed to delete workspace: ${await response.text()}`);
    return { success: true };
  }

  /**
   * Trigger an embedding update for a workspace.
   * This forces the vector database to re-sync with documents.
   */
  async updateEmbeddings(slug: string): Promise<{ success: boolean; response: any }> {
    const response = await fetch(`${this.baseUrl}/workspace/${slug}/update-embeddings`, {
      method: 'POST',
      headers: this.headers
    });
    if (!response.ok) throw new Error(`Failed to update embeddings: ${await response.text()}`);
    const data = await response.json();
    return { success: true, response: data };
  }

  // --- Chat ---

  /**
   * Send a chat message to a specific workspace.
   */
  async sendChat(slug: string, message: string, mode: 'chat' | 'query' = 'chat'): Promise<{ textResponse: string, sources: any[] }> {
    const response = await fetch(`${this.baseUrl}/workspace/${slug}/chat`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({ message, mode })
    });

    if (!response.ok) {
      throw new Error(`Chat failed (${response.status}): ${await response.text()}`);
    }

    const data = await response.json();
    return {
      textResponse: data.textResponse,
      sources: data.sources || []
    };
  }

  // --- System / Admin ---

  /**
   * Get all users (Admin only)
   */
  async getUsers(): Promise<AnythingLLMUser[]> {
    const response = await fetch(`${this.baseUrl}/system/users`, {
      method: 'GET',
      headers: this.headers
    });
    if (!response.ok) throw new Error(`Failed to fetch users (May require Admin privilege): ${response.statusText}`);
    const data = await response.json();
    return data.users || [];
  }
}

/**
 * UI Definitions for the API Playground.
 * This array maps methods of the SDK to a format the UI can render dynamically.
 */
export const SDK_METHODS: SDKMethodDefinition[] = [
  {
    method: 'getWorkspaces',
    label: 'Get All Workspaces',
    description: 'List all available workspaces in this instance.',
    params: []
  },
  {
    method: 'getWorkspace',
    label: 'Get Workspace Details',
    description: 'Get metadata about a specific workspace.',
    params: [
      { name: 'slug', type: 'slug', required: true, description: 'Workspace Slug (e.g. my-chat)' }
    ]
  },
  {
    method: 'createWorkspace',
    label: 'Create Workspace',
    description: 'Create a new empty workspace.',
    params: [
      { name: 'name', type: 'string', required: true, description: 'New Workspace Name' }
    ]
  },
  {
    method: 'deleteWorkspace',
    label: 'Delete Workspace',
    description: 'Permanently delete a workspace.',
    params: [
      { name: 'slug', type: 'slug', required: true, description: 'Slug to delete' }
    ]
  },
  {
    method: 'updateEmbeddings',
    label: 'Update Embeddings',
    description: 'Force a re-sync of the vector database for this workspace.',
    params: [
      { name: 'slug', type: 'slug', required: true, description: 'Target Workspace' }
    ]
  },
  {
    method: 'sendChat',
    label: 'Send Chat Message',
    description: 'Send a prompt to a workspace.',
    params: [
      { name: 'slug', type: 'slug', required: true, description: 'Target Workspace' },
      { name: 'message', type: 'string', required: true, description: 'Your prompt' },
      { name: 'mode', type: 'string', required: true, defaultValue: 'chat', description: '"chat" or "query"' }
    ]
  },
  {
    method: 'getUsers',
    label: 'Get Users (Admin)',
    description: 'List all registered users.',
    params: []
  }
];