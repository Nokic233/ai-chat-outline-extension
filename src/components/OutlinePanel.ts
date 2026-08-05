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

  public updateItems(items: QuestionItem[]): void {
    const isSessionChanged =
      items.length !== this.items.length ||
      (items.length > 0 && this.items.length > 0 && items[0].id !== this.items[0].id);

    this.items = items;
    this.activeIndex = this.calculateActiveIndex();
    this.render();

    // 当会话发生改变或初次加载时，延迟多次再次计算激活项，确保 SPA 布局渲染稳定
    if (isSessionChanged) {
      setTimeout(() => {
        if (!this.isProgrammaticScroll) {
          const newIdx = this.calculateActiveIndex();
          if (newIdx !== this.activeIndex) {
            this.activeIndex = newIdx;
            this.updateActiveHighlight();
          }
        }
      }, 150);

      setTimeout(() => {
        if (!this.isProgrammaticScroll) {
          const newIdx = this.calculateActiveIndex();
          if (newIdx !== this.activeIndex) {
            this.activeIndex = newIdx;
            this.updateActiveHighlight();
          }
        }
      }, 500);
    }
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

    // 1. 优先判断是否滚动到了聊天页面底部（如果是底部，直接定位到最后一个提问）
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

    // 2. 查找当前视口内位于 threshold 上方且未完全离开视口上方的最后一个提问
    let matchedIndex = -1;
    for (let i = 0; i < this.items.length; i++) {
      const rect = this.items[i].element.getBoundingClientRect();
      if (rect.top <= threshold && rect.bottom > 0) {
        matchedIndex = i;
      }
    }

    if (matchedIndex !== -1) {
      return matchedIndex;
    }

    // 3. 兜底方案：找到离 threshold 最近的提问
    let closestIdx = 0;
    let minDistance = Infinity;
    this.items.forEach((item, idx) => {
      const rect = item.element.getBoundingClientRect();
      const distance = Math.abs(rect.top - threshold);
      if (distance < minDistance) {
        minDistance = distance;
        closestIdx = idx;
      }
    });

    return closestIdx;
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
          <div class="panel-header">
            <div class="title-group">
              <span class="panel-title">提问大纲</span>
              <span class="badge">${this.items.length}</span>
            </div>
            <div class="header-actions">
              <button class="icon-btn copy-btn" title="复制提问 Markdown">📋</button>
              <button class="icon-btn pin-btn ${this.isPinned ? 'active' : ''}" title="${
        this.isPinned ? '取消固定' : '钉住固定'
      }">📌</button>
              <button class="icon-btn close-btn" title="折叠大纲">✕</button>
            </div>
          </div>
          
          <div class="search-container">
            <input type="text" class="search-input" placeholder="搜索提问..." value="${this.filterKeyword}" />
          </div>

          <div class="question-list">
            ${
              filteredItems.length > 0
                ? filteredItems
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
                : `<div class="empty-tip">未找到相关提问</div>`
            }
          </div>
        </div>
      `;

      // 绑定事件
      const panelEl = root.querySelector('.expanded-panel') as HTMLElement;
      if (!this.isPinned) {
        panelEl.addEventListener('mouseleave', () => {
          this.isExpanded = false;
          this.render();
        });
      }

      const searchInput = root.querySelector('.search-input') as HTMLInputElement;
      searchInput?.addEventListener('input', (e) => {
        this.filterKeyword = (e.target as HTMLInputElement).value;
        this.render();
        const newSearch = this.shadowRoot.querySelector('.search-input') as HTMLInputElement;
        newSearch?.focus();
      });

      const pinBtn = root.querySelector('.pin-btn');
      pinBtn?.addEventListener('click', () => {
        this.isPinned = !this.isPinned;
        this.render();
      });

      const closeBtn = root.querySelector('.close-btn');
      closeBtn?.addEventListener('click', () => {
        this.isExpanded = false;
        this.isPinned = false;
        this.render();
      });

      const copyBtn = root.querySelector('.copy-btn');
      copyBtn?.addEventListener('click', () => {
        this.copyAsMarkdown();
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
          // 将当前高亮项自动滚动到大纲弹出面板视口中央
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

    // 平滑滚动至目标消息
    item.element.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // 添加动画闪烁效果
    item.element.classList.remove('ai-outline-highlight');
    void item.element.offsetWidth; // force reflow
    item.element.classList.add('ai-outline-highlight');

    this.programmaticScrollTimer = window.setTimeout(() => {
      this.isProgrammaticScroll = false;
      item.element.classList.remove('ai-outline-highlight');
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

