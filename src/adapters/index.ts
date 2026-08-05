import { ChatAdapter } from '../types';
import { GeminiAdapter } from './gemini';
import { ChatGPTAdapter } from './chatgpt';
import { KimiAdapter } from './kimi';
import { GenericAdapter } from './generic';

const adapters: ChatAdapter[] = [
  new GeminiAdapter(),
  new ChatGPTAdapter(),
  new KimiAdapter(),
  new GenericAdapter(),
];

export function getAdapterForUrl(url: string = window.location.href): ChatAdapter {
  const match = adapters.find(a => a.isMatch(url));
  return match || new GenericAdapter();
}
