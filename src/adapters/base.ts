import { ChatAdapter, QuestionItem } from '../types';

export abstract class BaseAdapter implements ChatAdapter {
  abstract name: string;
  abstract isMatch(url: string): boolean;
  abstract getUserMessages(): QuestionItem[];

  getScrollContainer(): HTMLElement | Window {
    // 自动判断可滚动容器，默认找最近的大于屏幕高度且 overflow-y 为 scroll/auto 的容器
    const candidates = Array.from(document.querySelectorAll('*')) as HTMLElement[];
    for (const el of candidates) {
      const style = window.getComputedStyle(el);
      if (
        (style.overflowY === 'auto' || style.overflowY === 'scroll') &&
        el.scrollHeight > el.clientHeight &&
        el.clientHeight > 300
      ) {
        return el;
      }
    }
    return window;
  }

  observe(callback: () => void): () => void {
    const observer = new MutationObserver(() => {
      callback();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    return () => observer.disconnect();
  }

  isDarkMode(): boolean {
    const htmlTheme = document.documentElement.getAttribute('data-theme') || document.documentElement.className;
    const bodyTheme = document.body.className;
    const isDarkClass = (str: string) => /dark/i.test(str);
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    return isDarkClass(htmlTheme) || isDarkClass(bodyTheme) || prefersDark;
  }

  protected createQuestionItem(el: HTMLElement, rawText: string, index: number): QuestionItem {
    const fullText = rawText.trim().replace(/\s+/g, ' ');
    const maxLen = 40;
    const text = fullText.length > maxLen ? fullText.substring(0, maxLen) + '...' : fullText;
    
    // 如果元素没有 ID，为其生成临时 ID 以便精准控制
    if (!el.id) {
      el.id = `ai-chat-q-${index}-${Date.now().toString(36)}`;
    }

    return {
      id: el.id,
      text: text || `提问 #${index + 1}`,
      fullText: fullText || `提问 #${index + 1}`,
      element: el,
      index,
    };
  }
}
