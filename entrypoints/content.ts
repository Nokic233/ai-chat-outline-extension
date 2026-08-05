import { defineContentScript } from 'wxt/sandbox';
import { getAdapterForUrl } from '../src/adapters';
import { OutlinePanel } from '../src/components/OutlinePanel';

export default defineContentScript({
  matches: [
    'https://gemini.google.com/*',
    'https://chatgpt.com/*',
    'https://chat.openai.com/*',
    'https://*.kimi.com/*',
    'https://*.kimi.ai/*',
    'https://kimi.moonshot.cn/*',
    'https://*.baichuan-ai.com/*',
    'https://yuanbao.tencent.com/*'
  ],
  runAt: 'document_end',
  main() {
    console.log('[AI Chat Outline] Content Script injected on', window.location.href);

    let adapter = getAdapterForUrl(window.location.href);
    let panel: OutlinePanel | null = null;

    const syncOutline = () => {
      const currentAdapter = getAdapterForUrl(window.location.href);
      const items = currentAdapter.getUserMessages();
      if (items.length > 0) {
        if (!panel) {
          panel = new OutlinePanel(currentAdapter);
        }
        panel.updateItems(items);
      } else if (panel) {
        panel.updateItems([]);
      }
    };

    // 初次加载延迟执行，确保 AI 聊天 DOM 元素已渲染完成
    setTimeout(syncOutline, 800);
    setTimeout(syncOutline, 2000);

    // 监听 DOM 变化以应对 AJAX / SSE / 切换会话
    adapter.observe(() => {
      syncOutline();
    });

    // 监听 History API 切换 URL 页面
    let lastUrl = location.href;
    const urlCheckInterval = setInterval(() => {
      if (location.href !== lastUrl) {
        lastUrl = location.href;
        panel?.resetCache();
        setTimeout(syncOutline, 500);
      }
    }, 1000);
  }
});

