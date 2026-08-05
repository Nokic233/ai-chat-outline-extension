import { BaseAdapter } from './base';
import { QuestionItem } from '../types';

export class ChatGPTAdapter extends BaseAdapter {
  name = 'ChatGPT';

  isMatch(url: string): boolean {
    return url.includes('chatgpt.com') || url.includes('chat.openai.com');
  }

  getUserMessages(): QuestionItem[] {
    const selectors = [
      '[data-message-author-role="user"]',
      'div[class*="user-message"]',
      'div[data-is-user-message="true"]'
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
