import { BaseAdapter } from './base';
import { QuestionItem } from '../types';

export class GenericAdapter extends BaseAdapter {
  name = 'AI Chat (Generic)';

  isMatch(): boolean {
    return true; // 通用降级匹配
  }

  getUserMessages(): QuestionItem[] {
    const selectors = [
      '[data-role="user"]',
      '[data-author="user"]',
      '.user-message',
      '.human-message',
      '[class*="user-query"]',
      '[class*="UserMessage"]'
    ];

    const elements: HTMLElement[] = [];
    selectors.forEach(sel => {
      const found = Array.from(document.querySelectorAll(sel)) as HTMLElement[];
      found.forEach(el => {
        if (!elements.includes(el) && el.innerText?.trim()) {
          elements.push(el);
        }
      });
    });

    return elements.map((el, idx) => {
      const text = el.innerText || el.textContent || '';
      return this.createQuestionItem(el, text, idx);
    });
  }
}
