import { BaseAdapter } from './base';
import { QuestionItem } from '../types';

export class ChatGPTAdapter extends BaseAdapter {
  name = 'ChatGPT';

  isMatch(url: string): boolean {
    return url.includes('chatgpt.com') || url.includes('chat.openai.com');
  }

  override getScrollContainer(): HTMLElement | Window {
    const scroller = document.querySelector('div[class*="react-scroll-to-bottom"], [role="presentation"] .overflow-y-auto, main') as HTMLElement;
    if (scroller && scroller.scrollHeight > scroller.clientHeight + 5) {
      return scroller;
    }
    return super.getScrollContainer();
  }

  getUserMessages(): QuestionItem[] {
    const selectors = [
      '[data-message-author-role="user"]',
      'article[data-testid*="user"]',
      'div[class*="group/user"]',
      'div[class*="user-message"]',
      'div[class*="user_message"]',
      'div[data-is-user-message="true"]',
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
