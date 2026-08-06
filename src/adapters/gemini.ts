import { BaseAdapter } from './base';
import { QuestionItem } from '../types';

export class GeminiAdapter extends BaseAdapter {
  name = 'Google Gemini';

  isMatch(url: string): boolean {
    return url.includes('gemini.google.com');
  }

  override getScrollContainer(): HTMLElement | Window {
    const scroller = document.querySelector('infinite-scroller, .conversations-container, [class*="chat-history"], main') as HTMLElement;
    if (scroller && scroller.scrollHeight > scroller.clientHeight + 5) {
      return scroller;
    }
    return super.getScrollContainer();
  }

  getUserMessages(): QuestionItem[] {
    const selectors = [
      'user-query',
      '.user-query',
      '[data-test-id="user-query"]',
      '.query-text',
      '.user-query-container',
      'div[class*="query-content"]',
      'div[class*="user-query"]',
      'p[class*="query"]',
    ];

    return this.extractQuestionItemsFromSelectors(selectors);
  }

  override async scrollToQuestion(
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
      try {
        const prevMargin = targetEl.style.scrollMarginTop;
        targetEl.style.scrollMarginTop = '60px';
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        setTimeout(() => {
          targetEl!.style.scrollMarginTop = prevMargin;
        }, 800);
      } catch (e) {
        const scrollContainer = this.getScrollContainer();
        const targetRect = targetEl.getBoundingClientRect();
        const targetScrollTop = targetRect.top + window.scrollY - 24;
        await this.smoothScrollTo(scrollContainer, Math.max(0, targetScrollTop), 250);
      }

      this.highlightElement(targetEl);
    }
  }
}
