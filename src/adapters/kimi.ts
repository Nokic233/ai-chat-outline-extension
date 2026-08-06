import { BaseAdapter } from './base';
import { QuestionItem } from '../types';

export class KimiAdapter extends BaseAdapter {
  name = 'Kimi';

  isMatch(url: string): boolean {
    return url.includes('kimi.moonshot.cn') || url.includes('kimi.com') || url.includes('kimi.ai');
  }

  override getScrollContainer(): HTMLElement | Window {
    // 优先匹配 Kimi 专属聊天滚动主视图 .chat-detail-main
    const chatDetailMain = document.querySelector('.chat-detail-main, [class*="chat-detail-main"]') as HTMLElement;
    if (chatDetailMain && chatDetailMain.clientHeight > 100) {
      return chatDetailMain;
    }
    return super.getScrollContainer();
  }

  getUserMessages(): QuestionItem[] {
    const selectors = [
      '.chat-content-item-user',
      '[class*="chat-content-item-user"]',
      '.segment-user',
      '[class*="segment-user"]',
      '[class*="segment_user"]',
      '[class*="user-segment"]',
      '[class*="user_segment"]',
      '[data-testid*="user-message"]',
      '[class*="user-message"]',
      '[class*="userMessage"]',
      '[class*="chat-segment-user"]',
      '[class*="chat-item-user"]',
      '[class*="user-content"]',
      '[data-role="user"]',
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
      const scrollContainer = this.getScrollContainer();
      const topOffset = 20;

      if (scrollContainer instanceof HTMLElement && scrollContainer !== document.body && scrollContainer !== document.documentElement) {
        const containerRect = scrollContainer.getBoundingClientRect();
        const targetRect = targetEl.getBoundingClientRect();
        const relativeTop = targetRect.top - containerRect.top + scrollContainer.scrollTop;
        const targetScrollTop = relativeTop - topOffset;
        await this.smoothScrollTo(scrollContainer, Math.max(0, targetScrollTop), 250);
      } else {
        const targetRect = targetEl.getBoundingClientRect();
        const targetScrollTop = targetRect.top + window.scrollY - topOffset;
        await this.smoothScrollTo(window, Math.max(0, targetScrollTop), 250);
      }

      this.highlightElement(targetEl);
    }
  }
}


