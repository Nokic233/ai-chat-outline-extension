import { defineConfig } from 'wxt';

export default defineConfig({
  extensionApi: 'chrome',
  manifest: {
    name: 'AI Chat Outline - 对话提问大纲导航',
    description: '在 Gemini、ChatGPT、Claude、DeepSeek 等 AI 网站右侧提供交互式提问大纲，点击快速定位聊天位置。',
    version: '1.0.0',
    permissions: ['storage'],
    host_permissions: [
      'https://gemini.google.com/*',
      'https://chatgpt.com/*',
      'https://chat.openai.com/*',
      'https://claude.ai/*',
      'https://chat.deepseek.com/*',
      'https://kimi.moonshot.cn/*',
      'https://*.baichuan-ai.com/*',
      'https://yuanbao.tencent.com/*'
    ]
  }
});
