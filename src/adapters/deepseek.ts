import { BaseAdapter } from './base';
import { QuestionItem } from '../types';

export class DeepSeekAdapter extends BaseAdapter {
  name = 'DeepSeek';

  isMatch(url: string): boolean {
    return url.includes('chat.deepseek.com');
  }

  getUserMessages(): QuestionItem[] {
    const selectors = [
      '.fbb737a4',
      '[class*="user-message"]',
      'div[class*="ds-message-user"]',
      'div[class*="user"]'
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

    const validElements = elements.filter(el => {
      const parent = el.parentElement?.closest(selectors.join(','));
      return !parent;
    });

    return validElements.map((el, idx) => {
      const text = el.innerText || el.textContent || '';
      return this.createQuestionItem(el, text, idx);
    });
  }
}
