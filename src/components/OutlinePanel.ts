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

  private containerEl: HTMLElement | null = null;
  private scrollUnbind?: () => void;

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

    this.render();
    this.setupScrollListener();
  }

  public updateItems(items: QuestionItem[]): void {
    this.items = items;
    this.render();
  }

  private setupScrollListener(): void {
    const scrollContainer = this.adapter.getScrollContainer();
    const handleScroll = () => {
      if (this.items.length === 0) return;

      const viewportCenter = window.innerHeight / 3;
      let closestIdx = 0;
      let minDistance = Infinity;

      this.items.forEach((item, idx) => {
        const rect = item.element.getBoundingClientRect();
        const distance = Math.abs(rect.top - viewportCenter);
        if (distance < minDistance) {
          minDistance = distance;
          closestIdx = idx;
        }
      });

      if (this.activeIndex !== closestIdx) {
        this.activeIndex = closestIdx;
        this.updateActiveHighlight();
      }
    };

    scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
    this.scrollUnbind = () => scrollContainer.removeEventListener('scroll', handleScroll);
  }

  private render(): void {
    // 保护旧容器
    let root = this.shadowRoot.querySelector('.outline-root') as HTMLElement;
    if (!root) {
      root = document.createElement('div');
      root.className = `outline-root ${this.adapter.isDarkMode?.() ? 'dark' : 'light'}`;
      this.shadowRoot.appendChild(root);
    } else {
      root.className = `outline-root ${this.adapter.isDarkMode?.() ? 'dark' : 'light'}`;
    }

    const filteredItems = this.items.filter(item =>
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
              <button class="icon-btn pin-btn ${this.isPinned ? 'active' : ''}" title="${this.isPinned ? '取消固定' : '钉住固定'}">📌</button>
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
              <div class="list-item ${item.index === this.activeIndex ? 'active' : ''}" data-index="${item.index}" title="${this.escapeHtml(item.fullText)}">
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
        // 自动聚焦
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
      // 折叠状态（与用户提供的图片2保持一致：垂直短线数组，带有蓝线高亮）
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

    this.activeIndex = index;
    this.updateActiveHighlight();

    // 平滑滚动
    item.element.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // 添加动画闪烁效果
    item.element.classList.remove('ai-outline-highlight');
    // 强制 reflow
    void item.element.offsetWidth;
    item.element.classList.add('ai-outline-highlight');

    setTimeout(() => {
      item.element.classList.remove('ai-outline-highlight');
    }, 2000);
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
    this.scrollUnbind?.();
    this.hostEl.remove();
  }
}
