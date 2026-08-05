import { BaseAdapter } from './base';
import { QuestionItem } from '../types';

export class GeminiAdapter extends BaseAdapter {
  name = 'Google Gemini';

  isMatch(url: string): boolean {
    return url.includes('gemini.google.com');
  }

  getUserMessages(): QuestionItem[] {
    const selectors = [
      'user-query',
      '.user-query',
      '[data-test-id="user-query"]',
      '.query-text',
      '.user-query-container',
      'div[class*="query-content"]'
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

    // 过滤并去重（避免父节点与子节点同时存在）
    const validElements = elements.filter(el => {
      const parentQuery = el.parentElement?.closest(selectors.join(','));
      return !parentQuery;
    });

    return validElements.map((el, idx) => {
      const text = el.innerText || el.textContent || '';
      return this.createQuestionItem(el, text, idx);
    });
  }
}
