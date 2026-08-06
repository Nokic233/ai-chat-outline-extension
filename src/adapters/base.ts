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

  protected getLocalStorageTheme(): 'dark' | 'light' | 'system' | null {
    try {
      if (!window.localStorage) return null;

      // 1. 各平台精准 LocalStorage 映射规则
      // Google Gemini: Bard-Color-Theme => Bard-Light-Theme | Bard-Dark-Theme
      const bardTheme = localStorage.getItem('Bard-Color-Theme');
      if (bardTheme) {
        const lower = bardTheme.toLowerCase();
        if (lower.includes('light')) return 'light';
        if (lower.includes('dark')) return 'dark';
      }

      // 豆包 (Doubao): dbx-web-theme => light | system
      const dbxTheme = localStorage.getItem('dbx-web-theme');
      if (dbxTheme) {
        const lower = dbxTheme.toLowerCase().replace(/"/g, '').trim();
        if (lower === 'light') return 'light';
        if (lower === 'dark') return 'dark';
        if (lower === 'system') return 'system';
      }

      // Kimi: CUSTOM_THEME => "light" | "dark" | "system"
      const kimiTheme = localStorage.getItem('CUSTOM_THEME');
      if (kimiTheme) {
        const lower = kimiTheme.toLowerCase().replace(/"/g, '').trim();
        if (lower === 'light') return 'light';
        if (lower === 'dark') return 'dark';
        if (lower === 'system') return 'system';
      }

      // 腾讯元宝 (Yuanbao): yb_web_theme_mode => light | dark | system
      const yuanbaoTheme = localStorage.getItem('yb_web_theme_mode');
      if (yuanbaoTheme) {
        const lower = yuanbaoTheme.toLowerCase().replace(/"/g, '').trim();
        if (lower === 'light') return 'light';
        if (lower === 'dark') return 'dark';
        if (lower === 'system') return 'system';
      }

      // ChatGPT: theme => light | dark | system
      const chatgptTheme = localStorage.getItem('theme');
      if (chatgptTheme) {
        const lower = chatgptTheme.toLowerCase().replace(/"/g, '').trim();
        if (lower === 'light') return 'light';
        if (lower === 'dark') return 'dark';
        if (lower === 'system') return 'system';
      }

      // 2. 通用兜底列表（针对其它 AI 平台）
      const priorityKeys = [
        'color-scheme',
        'color_scheme',
        'theme-mode',
        'theme_mode',
        'ui-theme',
        'ui_theme',
        'user-theme',
        'user_theme',
        'mode',
        'appearance',
        'ark_theme',
        'color_mode',
      ];

      for (const key of priorityKeys) {
        const val = localStorage.getItem(key);
        if (val) {
          const lower = val.toLowerCase().replace(/"/g, '').trim();
          if (lower === 'light' || lower.includes('light') || lower.includes('day')) return 'light';
          if (lower === 'dark' || lower.includes('dark') || lower.includes('night')) return 'dark';
          if (lower === 'system' || lower.includes('system')) return 'system';
        }
      }

      // 3. 遍历解析 JSON 对象中的主题
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key) continue;
        const lowerKey = key.toLowerCase();
        if (
          lowerKey.includes('theme') ||
          lowerKey.includes('mode') ||
          lowerKey.includes('color') ||
          lowerKey.includes('appearance')
        ) {
          const val = localStorage.getItem(key);
          if (val) {
            const lowerVal = val.toLowerCase();
            if (/"(theme|mode|color_scheme|colorScheme|appearance)"\s*:\s*"(light|day)"/.test(lowerVal)) {
              return 'light';
            }
            if (/"(theme|mode|color_scheme|colorScheme|appearance)"\s*:\s*"(dark|night)"/.test(lowerVal)) {
              return 'dark';
            }
            if (/"(theme|mode|color_scheme|colorScheme|appearance)"\s*:\s*"(system)"/.test(lowerVal)) {
              return 'system';
            }
          }
        }
      }
    } catch (e) {
      // ignore
    }
    return null;
  }

  isDarkMode(): boolean {
    // 0. 优先尝试读取 AI 网页在 LocalStorage 中存放的主题配置
    const localTheme = this.getLocalStorageTheme();
    if (localTheme === 'light') return false;
    if (localTheme === 'dark') return true;
    if (localTheme === 'system') {
      // 网页明确设为跟随系统，此时严格同步系统的 prefers-color-scheme
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    }

    // 1. 严格 Class & Attribute 精准检查
    const rootEls = [document.documentElement, document.body].filter(Boolean) as HTMLElement[];
    for (const el of rootEls) {
      const classList = Array.from(el.classList);
      const dataTheme = (el.getAttribute('data-theme') || '').toLowerCase();
      const themeAttr = (el.getAttribute('theme') || '').toLowerCase();

      const hasDarkClass = classList.some((c) => c === 'dark' || c === 'dark-theme' || c === 'gmat-dark-theme');
      const hasLightClass = classList.some((c) => c === 'light' || c === 'light-theme' || c === 'gmat-light-theme');

      const isDarkAttr = dataTheme === 'dark' || themeAttr === 'dark';
      const isLightAttr = dataTheme === 'light' || themeAttr === 'light';

      if (hasLightClass || isLightAttr) return false;
      if (hasDarkClass || isDarkAttr) return true;
    }

    // 2. 物理 RGB 颜色解析辅助函数
    const parseRgb = (colorStr: string): { r: number; g: number; b: number } | null => {
      if (!colorStr || colorStr === 'transparent' || colorStr === 'rgba(0, 0, 0, 0)') return null;
      const match = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
      if (match) {
        const r = parseInt(match[1], 10);
        const g = parseInt(match[2], 10);
        const b = parseInt(match[3], 10);
        const a = match[4] !== undefined ? parseFloat(match[4]) : 1;
        if (a > 0.1) {
          return { r, g, b };
        }
      }
      return null;
    };

    // 视口物理坐标采样：直接测试视口中央及侧边的真实渲染 DOM 元素
    const points = [
      { x: window.innerWidth / 2, y: window.innerHeight / 2 },
      { x: Math.min(200, window.innerWidth - 20), y: 120 },
      { x: Math.max(20, window.innerWidth - 200), y: 120 },
    ];

    for (const pt of points) {
      try {
        let el = document.elementFromPoint(pt.x, pt.y) as HTMLElement | null;
        while (el && el !== document.documentElement) {
          const bg = window.getComputedStyle(el).backgroundColor;
          const color = parseRgb(bg);
          if (color) {
            const luminance = 0.299 * color.r + 0.587 * color.g + 0.114 * color.b;
            return luminance < 140;
          }
          el = el.parentElement;
        }
      } catch (e) {
        // ignore
      }
    }

    // 传统节点候选扫描
    const candidates: (HTMLElement | null)[] = [
      document.body,
      document.documentElement,
      document.querySelector('main'),
      document.querySelector('#__next'),
      document.querySelector('#app'),
      document.querySelector('[role="main"]'),
    ];

    try {
      const scrollContainer = this.getScrollContainer();
      if (scrollContainer instanceof HTMLElement) {
        candidates.push(scrollContainer);
      }
    } catch (e) {
      // ignore
    }

    for (const el of candidates) {
      if (!el) continue;
      const color = parseRgb(window.getComputedStyle(el).backgroundColor);
      if (color) {
        const luminance = 0.299 * color.r + 0.587 * color.g + 0.114 * color.b;
        return luminance < 140;
      }
    }

    // 3. 终极兜底：无 Class 且无法采样物理背景色时，跟随系统偏好
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
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


