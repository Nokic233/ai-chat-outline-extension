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
    'https://yuanbao.tencent.com/*',
    'https://*.yuanbao.tencent.com/*',
    'https://doubao.com/*',
    'https://*.doubao.com/*'
  ],
  runAt: 'document_end',
  main() {
    console.log('[AI Chat Outline] Script initialized on', window.location.href);

    let adapter = getAdapterForUrl(window.location.href);
    let panel: OutlinePanel | null = null;
    let unobserve: (() => void) | null = null;

    const setupObserver = () => {
      if (unobserve) {
        unobserve();
      }
      adapter = getAdapterForUrl(window.location.href);
      unobserve = adapter.observe(() => {
        syncOutline();
      });
    };

    const syncOutline = () => {
      const items = adapter.getUserMessages();
      if (items.length > 0) {
        if (!panel) {
          panel = new OutlinePanel(adapter);
        }
        panel.updateItems(items);
      } else if (panel) {
        panel.updateItems([]);
      }
    };

    // 绑定初始 MutationObserver
    setupObserver();

    // 延时触发初次同步，确保 DOM 完全加载
    setTimeout(syncOutline, 600);
    setTimeout(syncOutline, 1800);

    // 监听 SPA 路由 URL 变更
    let lastUrl = location.href;
    setInterval(() => {
      if (location.href !== lastUrl) {
        lastUrl = location.href;
        panel?.resetCache();
        setupObserver();
        setTimeout(syncOutline, 500);
      }
    }, 1000);
  }
});


