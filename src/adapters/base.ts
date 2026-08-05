import { ChatAdapter, QuestionItem } from '../types';

export abstract class BaseAdapter implements ChatAdapter {
  abstract name: string;
  abstract isMatch(url: string): boolean;
  abstract getUserMessages(): QuestionItem[];

  getScrollContainer(): HTMLElement | Window {
    // 1. 优先尝试从现有 DOM 中的提问节点向上寻找祖先滚动容器
    const messages = this.getUserMessages();
    for (const msg of messages) {
      if (document.body.contains(msg.element)) {
        const container = this.findParentScrollContainer(msg.element);
        if (container !== window) {
          return container;
        }
      }
    }

    // 2. 尝试从 <main> 标签或 [role="main"] 内部查找滚动容器
    const mainEl = document.querySelector('main') || document.querySelector('[role="main"]');
    if (mainEl) {
      if (this.isScrollable(mainEl as HTMLElement)) {
        return mainEl as HTMLElement;
      }
      const scrollableInMain = Array.from(mainEl.querySelectorAll('*')).find((el) =>
        this.isScrollable(el as HTMLElement)
      ) as HTMLElement;
      if (scrollableInMain) {
        return scrollableInMain;
      }
    }

    // 3. 通用全局查找，排除 nav / aside / sidebar 侧边栏元素
    const candidates = Array.from(document.querySelectorAll('*')) as HTMLElement[];
    for (const el of candidates) {
      if (this.isSidebarElement(el)) continue;
      if (this.isScrollable(el)) {
        return el;
      }
    }

    return window;
  }

  private isScrollable(el: HTMLElement): boolean {
    const style = window.getComputedStyle(el);
    return (
      (style.overflowY === 'auto' || style.overflowY === 'scroll') &&
      el.scrollHeight > el.clientHeight &&
      el.clientHeight > 150
    );
  }

  private isSidebarElement(el: HTMLElement): boolean {
    const navOrSidebar = el.closest('nav, aside, [role="navigation"], [class*="sidebar"], [class*="nav-"]');
    return navOrSidebar !== null;
  }

  private findParentScrollContainer(el: HTMLElement): HTMLElement | Window {
    let parent = el.parentElement;
    while (parent && parent !== document.body) {
      if (!this.isSidebarElement(parent) && this.isScrollable(parent)) {
        return parent;
      }
      parent = parent.parentElement;
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
    // 过滤开头的“你说”、“你:”、“You:”、“User:”等多余前缀
    let cleanedText = rawText.trim().replace(/^(你说|你|You|User)[:：\s]*/gi, '').trim();
    const fullText = cleanedText.replace(/\s+/g, ' ');
    const maxLen = 35;
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
