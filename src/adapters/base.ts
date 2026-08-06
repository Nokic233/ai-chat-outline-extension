import { ChatAdapter, QuestionItem } from '../types';

export abstract class BaseAdapter implements ChatAdapter {
  abstract name: string;
  abstract isMatch(url: string): boolean;
  abstract getUserMessages(): QuestionItem[];

  getScrollContainer(): HTMLElement | Window {
    // 1. 优先尝试从现有 DOM 中的提问节点向上寻找祖先滚动容器
    const messages = this.getUserMessages();
    for (const msg of messages) {
      if (document.body.contains(msg.element) && (msg.element.offsetHeight > 0 || msg.element.getClientRects().length > 0)) {
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

  protected isScrollable(el: HTMLElement): boolean {
    if (!el || el === document.body || el === document.documentElement) return false;
    const style = window.getComputedStyle(el);
    const overflowY = style.overflowY;
    const isScrollStyle = overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'overlay';
    return (
      isScrollStyle &&
      el.scrollHeight > el.clientHeight + 5 &&
      el.clientHeight > 100
    );
  }

  protected isSidebarElement(el: HTMLElement): boolean {
    const navOrSidebar = el.closest('nav, aside, [role="navigation"], [class*="sidebar"], [class*="nav-"]');
    return navOrSidebar !== null;
  }

  private findParentScrollContainer(el: HTMLElement): HTMLElement | Window {
    let parent = el.parentElement;
    while (parent && parent !== document.body && parent !== document.documentElement) {
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

  /**
   * 通用选择器 DOM 节点匹配与最外层去重函数
   * 自动过滤隐藏节点以及被更高层选择器重复匹配到的内部子节点
   */
  protected findUserNodes(selectors: string[]): HTMLElement[] {
    const rawElements: HTMLElement[] = [];
    selectors.forEach((sel) => {
      try {
        const found = Array.from(document.querySelectorAll(sel)) as HTMLElement[];
        found.forEach((el) => {
          if (!rawElements.includes(el)) {
            rawElements.push(el);
          }
        });
      } catch (e) {
        // ignore bad selector
      }
    });

    // 剔除隐藏节点及内层子节点，确保只保留最外层完整用户消息容器
    return rawElements.filter((el) => {
      // 仅当明确 display 为 none 或 visibility 为 hidden 时排除（避免 offsetParent===null 误删 position:fixed 或自定义元素节点）
      try {
        const style = window.getComputedStyle(el);
        if (style.display === 'none' || style.visibility === 'hidden') {
          return false;
        }
      } catch (e) {
        // ignore
      }
      const isChild = rawElements.some((other) => other !== el && other.contains(el));
      return !isChild;
    });
  }

  /**
   * 通用提问节点文本提取与清洗函数
   * 自动克隆节点并剔除工具栏、编辑按钮、复制按钮等噪点元素
   */
  protected cleanNodeText(el: HTMLElement, extraRemoveSelectors: string[] = []): string {
    const rawText = (el.innerText || el.textContent || '').trim();
    if (!rawText) return '';

    const clone = el.cloneNode(true) as HTMLElement;
    const defaultRemoveSelectors = [
      'button',
      '[role="button"]',
      '[class*="action"]',
      '[class*="tool"]',
      '[class*="btn"]',
      '[class*="ops"]',
      '[class*="edit"]',
      '[class*="toolbar"]',
      '[class*="icon"]',
      'svg',
    ];

    const removeSelectors = [...defaultRemoveSelectors, ...extraRemoveSelectors];
    removeSelectors.forEach((sel) => {
      try {
        clone.querySelectorAll(sel).forEach((node) => node.remove());
      } catch (e) {
        // ignore
      }
    });

    // 自定义元素或离线节点 clone.innerText 可能返回空，回退使用 clone.textContent 或 rawText
    let text = (clone.innerText || clone.textContent || rawText).trim();
    text = text.replace(/(编辑|复制|分享|Edit|Copy|Share)/g, '').trim();
    return text.replace(/\s+/g, ' ');
  }


  /**
   * 模版方法：根据传入的选择器与选项直接提取 QuestionItem 数组
   */
  protected extractQuestionItemsFromSelectors(
    selectors: string[],
    options?: {
      extraRemoveSelectors?: string[];
      ignoreKeywords?: string[];
    }
  ): QuestionItem[] {
    const nodes = this.findUserNodes(selectors);
    const items: QuestionItem[] = [];

    nodes.forEach((el) => {
      const text = this.cleanNodeText(el, options?.extraRemoveSelectors);
      if (!text) return;

      if (options?.ignoreKeywords) {
        const lowerText = text.toLowerCase();
        if (options.ignoreKeywords.some((kw) => lowerText.includes(kw))) {
          return;
        }
      }

      items.push(this.createQuestionItem(el, text, items.length));
    });

    return items;
  }

  protected createQuestionItem(el: HTMLElement, rawText: string, index: number): QuestionItem {
    // 过滤开头的“你说”、“你:”、“You:”、“User:”等多余前缀
    let cleanedText = rawText.trim().replace(/^(你说|你|You|User)[:：\s]+/gi, '').trim();
    const fullText = cleanedText.replace(/\s+/g, ' ');
    const maxLen = 35;
    const text = fullText.length > maxLen ? fullText.substring(0, maxLen) + '...' : fullText;

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

  /**
   * 判断元素是否在当前 DOM 中并且处于可见挂载状态
   */
  protected isElementVisible(el: HTMLElement): boolean {
    return (
      document.body.contains(el) &&
      (el.offsetHeight > 0 || el.offsetWidth > 0 || el.getClientRects().length > 0)
    );
  }

  /**
   * 给跳转到的目标元素施加高亮闪烁效果
   */
  protected highlightElement(el: HTMLElement): void {
    el.classList.remove('ai-outline-highlight');
    void el.offsetWidth; // force reflow
    el.classList.add('ai-outline-highlight');
    setTimeout(() => {
      el.classList.remove('ai-outline-highlight');
    }, 1000);
  }

  /**
   * 通用缓动平滑滚动函数
   */
  protected smoothScrollTo(
    container: HTMLElement | Window,
    targetTop: number,
    duration: number = 250
  ): Promise<void> {
    return new Promise((resolve) => {
      const isWindow =
        container === window || container === document.body || container === document.documentElement;
      const getScrollTop = () => (isWindow ? window.scrollY : (container as HTMLElement).scrollTop);
      const setScrollTop = (val: number) => {
        if (isWindow) {
          window.scrollTo({ top: val, behavior: 'auto' });
        } else {
          (container as HTMLElement).scrollTop = val;
        }
      };

      const startTop = getScrollTop();
      const change = targetTop - startTop;

      if (Math.abs(change) < 5) {
        setScrollTop(targetTop);
        resolve();
        return;
      }

      const startTime = performance.now();

      const animateScroll = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const ease = progress < 0.5 ? 2 * progress * progress : -1 + (4 - 2 * progress) * progress;

        setScrollTop(startTop + change * ease);

        if (progress < 1) {
          requestAnimationFrame(animateScroll);
        } else {
          resolve();
        }
      };

      requestAnimationFrame(animateScroll);
    });
  }

  /**
   * 适配器基类默认的跳转算法（通用 Fast-Path，适用全 DOM 渲染的常规 AI 网页）
   */
  async scrollToQuestion(
    item: QuestionItem,
    allItems: QuestionItem[],
    prevActiveIndex: number
  ): Promise<void> {
    let targetEl: HTMLElement | null = this.isElementVisible(item.element) ? item.element : null;

    if (!targetEl) {
      const latestItems = this.getUserMessages();
      const matched = latestItems.find(
        (latest) =>
          latest.index === item.index || latest.fullText === item.fullText || latest.text === item.text
      );
      if (matched && this.isElementVisible(matched.element)) {
        targetEl = matched.element;
        item.element = matched.element;
      }
    }

    if (targetEl && this.isElementVisible(targetEl)) {
      const scrollContainer = this.getScrollContainer();
      const topOffset = 24;
      const isWindow =
        scrollContainer === window ||
        scrollContainer === document.body ||
        scrollContainer === document.documentElement;

      if (isWindow) {
        const targetRect = targetEl.getBoundingClientRect();
        const targetScrollTop = targetRect.top + window.scrollY - topOffset;
        await this.smoothScrollTo(window, Math.max(0, targetScrollTop), 250);
      } else {
        const containerEl = scrollContainer as HTMLElement;
        const containerRect = containerEl.getBoundingClientRect();
        const targetRect = targetEl.getBoundingClientRect();
        const relativeTop = targetRect.top - containerRect.top + containerEl.scrollTop;
        const targetScrollTop = relativeTop - topOffset;
        await this.smoothScrollTo(containerEl, Math.max(0, targetScrollTop), 250);
      }

      this.highlightElement(targetEl);
    }
  }
}


