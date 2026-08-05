import { defineContentScript } from 'wxt/sandbox';
import { getAdapterForUrl } from '../src/adapters';
import { OutlinePanel } from '../src/components/OutlinePanel';

export default defineContentScript({
  matches: [
    'https://gemini.google.com/*',
    'https://chatgpt.com/*',
    'https://chat.openai.com/*',
    'https://claude.ai/*',
    'https://chat.deepseek.com/*',
    'https://kimi.moonshot.cn/*',
    'https://*.baichuan-ai.com/*',
    'https://yuanbao.tencent.com/*'
  ],
  runAt: 'document_end',
  main() {
    console.log('[AI Chat Outline] Content Script injected on', window.location.href);

    const adapter = getAdapterForUrl(window.location.href);
    let panel: OutlinePanel | null = null;

    const syncOutline = () => {
      const items = adapter.getUserMessages();
      if (items.length > 0) {
        if (!panel) {
          panel = new OutlinePanel(adapter);
        }
        panel.updateItems(items);
      }
    };

    // 初次加载延迟执行，确保 AI 聊天 DOM 元素已渲染完成
    setTimeout(syncOutline, 1000);
    setTimeout(syncOutline, 3000);

    // 监听 DOM 变化以应对 AJAX / SSE 增量回答
    adapter.observe(() => {
      syncOutline();
    });
  }
});
