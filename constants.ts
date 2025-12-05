import { PromptPreset, LLMProvider } from './types';

export const DEFAULT_PROVIDER: LLMProvider = 'anythingllm';
export const DEFAULT_HOST = 'http://localhost';
export const DEFAULT_OLLAMA_PORT = '11434';
export const DEFAULT_ANYTHINGLLM_PORT = '3001';
// Default testing values
export const DEFAULT_MODEL = 'mini'; 
export const DEFAULT_API_KEY = 'FNSXGP0-ABZMZRW-HNRGGHG-NXA90ZQ';

export const PROMPT_PRESETS: PromptPreset[] = [
  {
    id: 'joke',
    title: 'Tell a Joke',
    text: 'Tell me a short, witty programming joke.',
    icon: 'smile'
  },
  {
    id: 'haiku',
    title: 'Write a Haiku',
    text: 'Write a haiku about the beauty of clean code.',
    icon: 'feather'
  },
  {
    id: 'explain',
    title: 'Explain Concept',
    text: 'Explain how a neural network works to a 5-year-old in one paragraph.',
    icon: 'book'
  },
  {
    id: 'json',
    title: 'Generate JSON',
    text: 'Generate a sample JSON object for a user profile with fields: id, name, email, and preferences.',
    icon: 'code'
  },
  {
    id: 'hello',
    title: 'Hello World',
    text: 'Say "Hello World" in 5 different languages.',
    icon: 'globe'
  }
];