import { BaseAdapter } from './base';
import { QuestionItem } from '../types';

export class ClaudeAdapter extends BaseAdapter {
  name = 'Claude';

  isMatch(url: string): boolean {
    return url.includes('claude.ai');
  }

  getUserMessages(): QuestionItem[] {
    const selectors = [
      '[data-testid="user-message"]',
      '.font-user-message',
      'div[class*="UserMessage"]'
    ];

    const elements: HTMLElement[] = [];
    selectors.forEach(sel => {
      const found = Array.from(document.querySelectorAll(sel)) as HTMLElement[];
      found.forEach(el => {
        if (!elements.includes(el)) {
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
