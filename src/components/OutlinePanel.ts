import { ChatAdapter, QuestionItem } from '../types';
import stylesText from './styles.css?raw';

export class OutlinePanel {
  private hostEl: HTMLElement;
  private shadowRoot: ShadowRoot;
  private adapter: ChatAdapter;
  
  private items: QuestionItem[] = [];
  private activeIndex: number = -1;
  private isExpanded: boolean = false;
  private isPinned: boolean = false;
  private filterKeyword: string = '';
  private isProgrammaticScroll: boolean = false;
  private programmaticScrollTimer?: number;

  private handleScrollBound: (e: Event) => void;

  constructor(adapter: ChatAdapter) {
    this.adapter = adapter;

    this.hostEl = document.createElement('div');
    this.hostEl.id = 'ai-chat-outline-host';
    this.shadowRoot = this.hostEl.attachShadow({ mode: 'open' });

    // 插入样式
    const styleSheet = document.createElement('style');
    styleSheet.textContent = stylesText;
    this.shadowRoot.appendChild(styleSheet);

    // 绑定到 document.body
    document.body.appendChild(this.hostEl);

    // 全局捕获所有滚动事件（支持任何子容器滚动）
    this.handleScrollBound = this.handleScroll.bind(this);
    window.addEventListener('scroll', this.handleScrollBound, { capture: true, passive: true });

    this.render();
  }

  public resetCache(): void {
    this.items = [];
    this.activeIndex = -1;
  }

  public updateItems(scannedItems: QuestionItem[]): void {
    const prevItemsLength = this.items.length;

    if (scannedItems.length > 0) {
      this.mergeItems(scannedItems);
    }

    const prevActiveIndex = this.activeIndex;

    if (!this.isProgrammaticScroll) {
      const newActiveIndex = this.calculateActiveIndex();
      if (newActiveIndex !== -1) {
        this.activeIndex = newActiveIndex;
      }
    }

    // 只有在大纲项目数量变化时才重新渲染 HTML 模板（避免 DOM 重建导致 UI 闪烁）
    if (prevItemsLength !== this.items.length) {
      this.render();
    } else if (prevActiveIndex !== this.activeIndex) {
      // 仅仅是激活索引改变，做增量 DOM class 切换
      this.updateActiveHighlight();
    }
  }

  private mergeItems(scannedItems: QuestionItem[]): void {
    if (scannedItems.length === 0) return;

    if (this.items.length === 0) {
      this.items = [...scannedItems];
      this.items.forEach((item, idx) => {
        item.index = idx;
      });
      return;
    }

    // 寻找 scannedItems 与 this.items 之间的第一个相交锚点
    let sAnchor = -1;
    let hAnchor = -1;

    for (let sIdx = 0; sIdx < scannedItems.length; sIdx++) {
      const hIdx = this.items.findIndex((item) => item.fullText === scannedItems[sIdx].fullText);
      if (hIdx !== -1) {
        sAnchor = sIdx;
        hAnchor = hIdx;
        break;
      }
    }

    if (sAnchor !== -1 && hAnchor !== -1) {
      const prependItems: QuestionItem[] = [];

      scannedItems.forEach((scanned, sIdx) => {
        const targetIdx = hAnchor + (sIdx - sAnchor);
        if (targetIdx >= 0 && targetIdx < this.items.length) {
          this.items[targetIdx].element = scanned.element;
        } else if (targetIdx >= this.items.length) {
          this.items.push({ ...scanned });
        } else {
          // targetIdx < 0：向上滚动加载出的顶部更早的提问
          prependItems.push({ ...scanned });
        }
      });

      if (prependItems.length > 0) {
        this.items = [...prependItems, ...this.items];
      }
    } else {
      // 无法与已有历史找到重叠节点（如切换了会话或重置），使用最新扫描到的列表
      this.items = [...scannedItems];
    }

    this.items.forEach((item, idx) => {
      item.index = idx;
    });
  }

  private handleScroll(): void {
    if (this.items.length === 0 || this.isProgrammaticScroll) return;

    const newIdx = this.calculateActiveIndex();
    if (newIdx !== this.activeIndex && newIdx !== -1) {
      this.activeIndex = newIdx;
      this.updateActiveHighlight();
    }
  }

  private calculateActiveIndex(): number {
    if (this.items.length === 0) return -1;

    const viewportHeight = window.innerHeight;
    const threshold = viewportHeight * 0.35; // 判定参照线：屏幕上方 35% 位置

    // 1. 优先判断是否滚动到了聊天页面底部
    const scrollContainer = this.adapter.getScrollContainer();
    if (scrollContainer instanceof HTMLElement) {
      const isAtBottom =
        scrollContainer.scrollHeight - scrollContainer.scrollTop - scrollContainer.clientHeight < 60;
      if (isAtBottom && this.items.length > 0) {
        return this.items.length - 1;
      }
    } else if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 60) {
      return this.items.length - 1;
    }

    // 2. 查找当前视口内位于 threshold 上方且未完全离开视口的最后一个提问（仅计算在 DOM 中的元素）
    let matchedIndex = -1;
    for (let i = 0; i < this.items.length; i++) {
      const el = this.items[i].element;
      if (document.body.contains(el)) {
        const rect = el.getBoundingClientRect();
        if (rect.top <= threshold && rect.bottom > 0) {
          matchedIndex = i;
        }
      }
    }

    if (matchedIndex !== -1) {
      return matchedIndex;
    }

    // 3. 兜底方案：找到离 threshold 最近的挂载中提问
    let closestIdx = -1;
    let minDistance = Infinity;
    this.items.forEach((item, idx) => {
      if (document.body.contains(item.element)) {
        const rect = item.element.getBoundingClientRect();
        const distance = Math.abs(rect.top - threshold);
        if (distance < minDistance) {
          minDistance = distance;
          closestIdx = idx;
        }
      }
    });

    return closestIdx !== -1 ? closestIdx : this.activeIndex;
  }

  private render(): void {
    let root = this.shadowRoot.querySelector('.outline-root') as HTMLElement;
    if (!root) {
      root = document.createElement('div');
      root.className = `outline-root ${this.adapter.isDarkMode?.() ? 'dark' : 'light'}`;
      this.shadowRoot.appendChild(root);
    } else {
      root.className = `outline-root ${this.adapter.isDarkMode?.() ? 'dark' : 'light'}`;
    }

    const filteredItems = this.items.filter((item) =>
      item.fullText.toLowerCase().includes(this.filterKeyword.toLowerCase())
    );

    if (this.isExpanded) {
      root.innerHTML = `
        <div class="expanded-panel">
          <div class="question-list">
            ${
              this.items.length > 0
                ? this.items
                    .map(
                      (item) => `
              <div class="list-item ${item.index === this.activeIndex ? 'active' : ''}" data-index="${
                        item.index
                      }" title="${this.escapeHtml(item.fullText)}">
                <span class="item-text">${this.escapeHtml(item.text)}</span>
                <span class="item-dash"></span>
              </div>
            `
                    )
                    .join('')
                : `<div class="empty-tip">暂无提问</div>`
            }
          </div>
        </div>
      `;

      // 绑定事件：鼠标离开极简卡片自动折叠
      const panelEl = root.querySelector('.expanded-panel') as HTMLElement;
      panelEl?.addEventListener('mouseleave', () => {
        this.isExpanded = false;
        this.render();
      });

      const listItems = root.querySelectorAll('.list-item');
      listItems.forEach((el) => {
        el.addEventListener('click', () => {
          const idx = parseInt(el.getAttribute('data-index') || '0', 10);
          this.scrollToQuestion(idx);
        });
      });
    } else {
      // 折叠状态（垂直短线列表）
      const dashCount = Math.max(this.items.length, 1);
      root.innerHTML = `
        <div class="collapsed-bar" title="提问大纲 (${this.items.length})">
          ${Array.from({ length: dashCount })
            .map(
              (_, idx) => `
            <div class="dash-item ${idx === this.activeIndex ? 'active' : ''}"></div>
          `
            )
            .join('')}
        </div>
      `;

      const collapsedBar = root.querySelector('.collapsed-bar');
      collapsedBar?.addEventListener('mouseenter', () => {
        this.isExpanded = true;
        this.render();
      });
      collapsedBar?.addEventListener('click', () => {
        this.isExpanded = true;
        this.render();
      });
    }
  }

  private updateActiveHighlight(): void {
    const root = this.shadowRoot.querySelector('.outline-root');
    if (!root) return;

    if (this.isExpanded) {
      const items = root.querySelectorAll('.list-item');
      items.forEach((item) => {
        const idx = parseInt(item.getAttribute('data-index') || '0', 10);
        if (idx === this.activeIndex) {
          item.classList.add('active');
          (item as HTMLElement).scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        } else {
          item.classList.remove('active');
        }
      });
    } else {
      const dashes = root.querySelectorAll('.dash-item');
      dashes.forEach((dash, idx) => {
        if (idx === this.activeIndex) {
          dash.classList.add('active');
        } else {
          dash.classList.remove('active');
        }
      });
    }
  }

  private scrollToQuestion(index: number): void {
    const item = this.items.find((i) => i.index === index);
    if (!item) return;

    this.isProgrammaticScroll = true;
    if (this.programmaticScrollTimer) {
      clearTimeout(this.programmaticScrollTimer);
    }

    this.activeIndex = index;
    this.updateActiveHighlight();

    const isElementVisible = (el: HTMLElement) => {
      return (
        document.body.contains(el) &&
        (el.offsetHeight > 0 || el.offsetWidth > 0 || el.getClientRects().length > 0)
      );
    };

    // 尝试在页面中查找最新匹配的 live 节点（解决 SPA / React 重新渲染后 DOM 节点引用失效或尺寸变 0 的问题）
    let targetEl: HTMLElement | null = isElementVisible(item.element) ? item.element : null;

    if (!targetEl) {
      const latestItems = this.adapter.getUserMessages();
      const matched = latestItems.find(
        (latest) => latest.index === index || latest.fullText === item.fullText || latest.text === item.text
      );
      if (matched && isElementVisible(matched.element)) {
        targetEl = matched.element;
        item.element = matched.element; // 更新缓存中的元素引用
      }
    }

    const scrollContainer = this.adapter.getScrollContainer();

    if (targetEl && isElementVisible(targetEl)) {
      this.performScrollToElement(scrollContainer, targetEl);
      this.highlightElement(targetEl);
    } else {
      // 节点暂不在 DOM 中（虚拟列表回收），按估算比例触发滚动以让虚拟列表渲染节点
      let targetScrollTop = 0;
      const isWindow = scrollContainer === window || scrollContainer === document.body || scrollContainer === document.documentElement;

      const maxScroll = isWindow
        ? Math.max(document.body.scrollHeight, document.documentElement.scrollHeight) - window.innerHeight
        : (scrollContainer as HTMLElement).scrollHeight - (scrollContainer as HTMLElement).clientHeight;

      if (index === 0) {
        targetScrollTop = 0;
      } else if (index === this.items.length - 1) {
        targetScrollTop = maxScroll;
      } else {
        const targetRatio = index / Math.max(this.items.length - 1, 1);
        targetScrollTop = maxScroll * targetRatio;
      }

      if (isWindow) {
        this.smoothScrollTo(window, Math.max(0, targetScrollTop), 250);
      } else {
        this.smoothScrollTo(scrollContainer as HTMLElement, Math.max(0, targetScrollTop), 250);
      }

      // 多轮重试精确定位
      const tryLocateAndScroll = (attemptsLeft: number) => {
        const latestItems = this.adapter.getUserMessages();
        const matched = latestItems.find(
          (latest) => latest.index === index || latest.fullText === item.fullText || latest.text === item.text
        );

        if (matched && isElementVisible(matched.element)) {
          item.element = matched.element;
          this.performScrollToElement(scrollContainer, matched.element);
          this.highlightElement(matched.element);
        } else if (attemptsLeft > 0) {
          setTimeout(() => tryLocateAndScroll(attemptsLeft - 1), 150);
        }
      };

      setTimeout(() => tryLocateAndScroll(5), 100);
    }

    this.programmaticScrollTimer = window.setTimeout(() => {
      this.isProgrammaticScroll = false;
    }, 1000);
  }

  private performScrollToElement(scrollContainer: HTMLElement | Window, targetEl: HTMLElement): void {
    if (scrollContainer instanceof HTMLElement && scrollContainer !== document.body && scrollContainer !== document.documentElement) {
      const containerRect = scrollContainer.getBoundingClientRect();
      const targetRect = targetEl.getBoundingClientRect();
      const relativeTop = targetRect.top - containerRect.top + scrollContainer.scrollTop;
      const targetScrollTop = relativeTop - (containerRect.height / 2) + (targetRect.height / 2);

      this.smoothScrollTo(scrollContainer, Math.max(0, targetScrollTop), 250);
    } else {
      const targetRect = targetEl.getBoundingClientRect();
      const targetScrollTop = targetRect.top + window.scrollY - (window.innerHeight / 2) + (targetRect.height / 2);
      this.smoothScrollTo(window, Math.max(0, targetScrollTop), 250);
    }
  }

  private smoothScrollTo(
    container: HTMLElement | Window,
    targetTop: number,
    duration: number = 250
  ): Promise<void> {
    return new Promise((resolve) => {
      const isWindow = container === window || container === document.body || container === document.documentElement;
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

  private highlightElement(el: HTMLElement): void {
    el.classList.remove('ai-outline-highlight');
    void el.offsetWidth; // force reflow
    el.classList.add('ai-outline-highlight');
    setTimeout(() => {
      el.classList.remove('ai-outline-highlight');
    }, 1000);
  }

  private copyAsMarkdown(): void {
    if (this.items.length === 0) return;
    const md = this.items.map((item, idx) => `${idx + 1}. ${item.fullText}`).join('\n\n');
    navigator.clipboard.writeText(md).then(() => {
      const copyBtn = this.shadowRoot.querySelector('.copy-btn');
      if (copyBtn) {
        copyBtn.textContent = '✅';
        setTimeout(() => {
          copyBtn.textContent = '📋';
        }, 1500);
      }
    });
  }

  private escapeHtml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  public destroy(): void {
    window.removeEventListener('scroll', this.handleScrollBound, { capture: true });
    this.hostEl.remove();
  }
}

