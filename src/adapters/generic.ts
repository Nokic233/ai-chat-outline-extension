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
      '[class*="UserMessage"]',
      '[class*="user_message"]',
    ];

    return this.extractQuestionItemsFromSelectors(selectors);
  }
}

