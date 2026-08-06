import { BaseAdapter } from './base';
import { QuestionItem } from '../types';

export class DoubaoAdapter extends BaseAdapter {
  name = 'Doubao';

  isMatch(url: string): boolean {
    return url.includes('doubao.com');
  }

  override getScrollContainer(): HTMLElement | Window {
    // 优先寻找豆包的专属聊天滚动容器
    const scroller = document.querySelector('.scroller, [class*="v_list_scroller"], [class*="scroller"]') as HTMLElement;
    if (scroller && scroller.clientHeight > 100) {
      return scroller;
    }
    return super.getScrollContainer();
  }

  getUserMessages(): QuestionItem[] {
    const selectors = [
      '.bg-g-send-msg-bubble-bg',
      '[class*="send-msg-bubble"]',
      '[class*="bubble-bg"]',
      '[class*="user-message"]',
      '[class*="userMessage"]',
      '[class*="bubble-user"]',
      '[class*="user_bubble"]',
      '[data-role="user"]',
    ];

    return this.extractQuestionItemsFromSelectors(selectors);
  }

  override async scrollToQuestion(
    item: QuestionItem,
    allItems: QuestionItem[],
    prevActiveIndex: number
  ): Promise<void> {

    const scrollContainer = this.getScrollContainer();
    const isWindow =
      scrollContainer === window ||
      scrollContainer === document.body ||
      scrollContainer === document.documentElement;

    const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

    const getScrollTop = () => (isWindow ? window.scrollY : (scrollContainer as HTMLElement).scrollTop);
    const setScrollTop = (val: number) => {
      if (isWindow) {
        window.scrollTo({ top: val, behavior: 'auto' });
      } else {
        (scrollContainer as HTMLElement).scrollTop = val;
      }
    };

    let targetEl: HTMLElement | null = this.isElementVisible(item.element) ? item.element : null;

    // 1. 如果节点已经在 DOM 中，直接平滑定位
    if (targetEl && this.isElementVisible(targetEl)) {
      const topOffset = 24;
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
      return;
    }

    // 2. 豆包专属虚拟列表探测：逐步步进滚动直至 DOM 渲染目标节点
    if (item.index === 0) {
      setScrollTop(0);
      await delay(80);
    }

    const direction = item.index < prevActiveIndex ? -1 : 1;

    for (let attempt = 0; attempt < 35; attempt++) {
      const latestItems = this.getUserMessages();
      const matched = latestItems.find(
        (latest) =>
          latest.index === item.index || latest.fullText === item.fullText || latest.text === item.text
      );

      if (matched && this.isElementVisible(matched.element)) {
        targetEl = matched.element;
        item.element = matched.element;
        break;
      }

      const prevScroll = getScrollTop();
      setScrollTop(prevScroll + direction * 350);
      await delay(50);

      if (getScrollTop() === prevScroll) {
        break;
      }
    }

    // 3. 得到节点后像素级微调
    if (targetEl && this.isElementVisible(targetEl)) {
      const topOffset = 24;
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


