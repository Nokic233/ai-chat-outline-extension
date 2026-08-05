import { BaseAdapter } from './base';
import { QuestionItem } from '../types';

export class KimiAdapter extends BaseAdapter {
  name = 'Kimi';

  isMatch(url: string): boolean {
    return url.includes('kimi.moonshot.cn');
  }

  getUserMessages(): QuestionItem[] {
    const selectors = [
      '.segment-user',
      '[class*="segment-user"]',
      '[class*="user-segment"]'
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
