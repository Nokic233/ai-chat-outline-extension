import { BaseAdapter } from './base';
import { QuestionItem } from '../types';

export class YuanbaoAdapter extends BaseAdapter {
  name = '腾讯元宝';

  isMatch(url: string): boolean {
    return url.includes('yuanbao.tencent.com');
  }

  override getScrollContainer(): HTMLElement | Window {
    const scrollSelectors = [
      '[class*="agent-chat__bubble-wrap"]',
      '[class*="chat-scroll"]',
      '[class*="chat-container"]',
      '[class*="chat-content"]',
      '[class*="scroll-container"]',
      '[class*="chat-records"]',
      '[class*="message-list"]',
      'main'
    ];
    for (const sel of scrollSelectors) {
      const container = document.querySelector(sel) as HTMLElement;
      if (container && container.clientHeight > 100) {
        return container;
      }
    }
    return super.getScrollContainer();
  }

  getUserMessages(): QuestionItem[] {
    const selectors = [
      // 腾讯元宝专用与通用用户气泡/消息选择器
      '[class*="agent-chat__bubble--user"]',
      '[class*="agent-chat__bubble-user"]',
      '[class*="agent-chat__bubble"][class*="user"]',
      '[class*="agent-chat__bubble"][class*="right"]',
      '.agent-chat__bubble--user',
      '[class*="user-bubble"]',
      '[class*="user_bubble"]',
      '[class*="userBubble"]',
      '[class*="chat-message-user"]',
      '[class*="chat-item-user"]',
      '[class*="chat-user-item"]',
      '[class*="user-message"]',
      '[class*="userMessage"]',
      '[class*="user_message"]',
      '[class*="user-query"]',
      '[class*="userQuery"]',
      '[class*="user-content"]',
      '[class*="userContent"]',
      '[class*="human-message"]',
      '[data-role="user"]',
      '[data-author="user"]',
      '[data-user="true"]',
      '[data-is-user="true"]'
    ];

    let elements: HTMLElement[] = [];
    selectors.forEach(sel => {
      const found = Array.from(document.querySelectorAll(sel)) as HTMLElement[];
      found.forEach(el => {
        if (!elements.includes(el)) {
          elements.push(el);
        }
      });
    });

    // 智能降级搜索：如果精确选择器没提取到节点，遍历所有气泡/消息容器
    if (elements.length === 0) {
      const candidates = Array.from(
        document.querySelectorAll('div[class*="bubble"], div[class*="message"], div[class*="item"], div[class*="chat-record"]')
      ) as HTMLElement[];

      candidates.forEach(el => {
        const cls = (el.className || '').toString().toLowerCase();
        const dataRole = (el.getAttribute('data-role') || '').toLowerCase();

        const isUserSide = 
          cls.includes('user') || 
          cls.includes('human') || 
          cls.includes('query') || 
          cls.includes('question') || 
          cls.includes('right') || 
          dataRole === 'user';

        const isBotSide = 
          cls.includes('assistant') || 
          cls.includes('bot') || 
          cls.includes('system') || 
          cls.includes('agent-chat__bubble--ai') || 
          cls.includes('agent-chat__bubble--bot');

        if (isUserSide && !isBotSide && el.innerText?.trim()) {
          if (!elements.includes(el)) {
            elements.push(el);
          }
        }
      });
    }

    // 过滤父节点，去重防嵌套
    const validElements = elements.filter(el => {
      const parent = el.parentElement?.closest(selectors.join(','));
      return !parent;
    });

    const items: QuestionItem[] = [];

    validElements.forEach((el, idx) => {
      // 提取纯文本节点
      const textEl = (el.querySelector('.hyc-content-text, [class*="content-text"], [class*="user-content"], [class*="text"]') as HTMLElement) || el;
      
      const clone = textEl.cloneNode(true) as HTMLElement;
      const removeSelectors = [
        'button',
        '[role="button"]',
        '[class*="action"]',
        '[class*="toolbar"]',
        '[class*="btn"]',
        '[class*="icon"]',
        'svg'
      ];
      removeSelectors.forEach(s => {
        clone.querySelectorAll(s).forEach(node => node.remove());
      });

      const text = clone.innerText || clone.textContent || '';
      if (text.trim()) {
        items.push(this.createQuestionItem(el, text, idx));
      }
    });

    return items;
  }
}
