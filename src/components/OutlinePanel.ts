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
    if (scannedItems.length > 0) {
      this.mergeItems(scannedItems);
    }

    const prevActiveIndex = this.activeIndex;
    this.activeIndex = this.calculateActiveIndex();

    if (prevActiveIndex !== this.activeIndex) {
      this.render();
    }
  }

  private mergeItems(scannedItems: QuestionItem[]): void {
    if (scannedItems.length === 0) return;

    if (this.items.length === 0) {
      this.items = [...scannedItems];
      return;
    }

    // 尝试在历史缓存中定位 scannedItems 的匹配锚点
    let matchedStartIndex = this.items.findIndex((item) => item.fullText === scannedItems[0].fullText);

    if (matchedStartIndex !== -1) {
      scannedItems.forEach((scanned, offset) => {
        const targetIdx = matchedStartIndex + offset;
        if (targetIdx < this.items.length) {
          this.items[targetIdx].element = scanned.element;
        } else {
          scanned.index = this.items.length;
          this.items.push({ ...scanned });
        }
      });
    } else {
      let firstFoundInHistory = -1;
      let firstFoundInScanned = -1;

      for (let sIdx = 0; sIdx < scannedItems.length; sIdx++) {
        const hIdx = this.items.findIndex((item) => item.fullText === scannedItems[sIdx].fullText);
        if (hIdx !== -1) {
          firstFoundInHistory = hIdx;
          firstFoundInScanned = sIdx;
          break;
        }
      }

      if (firstFoundInHistory !== -1 && firstFoundInScanned !== -1) {
        scannedItems.forEach((scanned, sIdx) => {
          const targetIdx = firstFoundInHistory + (sIdx - firstFoundInScanned);
          if (targetIdx >= 0 && targetIdx < this.items.length) {
            this.items[targetIdx].element = scanned.element;
          } else if (targetIdx >= this.items.length) {
            scanned.index = this.items.length;
            this.items.push({ ...scanned });
          }
        });
      } else {
        // 完全无法重合（可能切换了会话），重置列表
        this.items = [...scannedItems];
      }
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

    const scrollContainer = this.adapter.getScrollContainer();
    const isElementInDOM = document.body.contains(item.element);

    if (isElementInDOM) {
      item.element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      this.highlightElement(item.element);
    } else {
      // 节点暂不在 DOM 中（虚拟列表回收），先估算粗略位置进行滚动以触发渲染
      const targetRatio = index / Math.max(this.items.length - 1, 1);
      if (scrollContainer instanceof HTMLElement) {
        const targetScrollTop = (scrollContainer.scrollHeight - scrollContainer.clientHeight) * targetRatio;
        scrollContainer.scrollTo({ top: targetScrollTop, behavior: 'smooth' });
      } else {
        const targetScrollTop = (document.body.offsetHeight - window.innerHeight) * targetRatio;
        window.scrollTo({ top: targetScrollTop, behavior: 'smooth' });
      }

      // 多轮重试匹配元素精确定位
      const tryLocateAndScroll = (attemptsLeft: number) => {
        const latestItems = this.adapter.getUserMessages();
        const matched = latestItems.find(
          (latest) => latest.fullText === item.fullText || latest.text === item.text
        );

        if (matched && document.body.contains(matched.element)) {
          item.element = matched.element;
          item.element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          this.highlightElement(matched.element);
        } else if (attemptsLeft > 0) {
          setTimeout(() => tryLocateAndScroll(attemptsLeft - 1), 200);
        }
      };

      setTimeout(() => tryLocateAndScroll(4), 150);
    }

    this.programmaticScrollTimer = window.setTimeout(() => {
      this.isProgrammaticScroll = false;
    }, 1000);
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

