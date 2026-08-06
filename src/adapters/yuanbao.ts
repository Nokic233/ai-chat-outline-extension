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
      'main',
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
      '[class*="agent-chat__bubble--user"]',
      '[class*="agent-chat__bubble-user"]',
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
      '[class*="human-message"]',
      '[data-role="user"]',
      '[data-author="user"]',
    ];

    let validElements = this.findUserNodes(selectors);

    // 智能降级搜索：仅在精准选择器未匹配到任何节点时使用
    if (validElements.length === 0) {
      const candidates = Array.from(
        document.querySelectorAll('div[class*="bubble"], div[class*="message"], div[class*="chat-record"]')
      ) as HTMLElement[];

      const fallbackNodes: HTMLElement[] = [];
      candidates.forEach((el) => {
        const cls = (el.className || '').toString().toLowerCase();
        const dataRole = (el.getAttribute('data-role') || '').toLowerCase();

        const isUserSide =
          cls.includes('user') ||
          cls.includes('human') ||
          cls.includes('query') ||
          cls.includes('question') ||
          dataRole === 'user';

        const isBotSide =
          cls.includes('assistant') ||
          cls.includes('bot') ||
          cls.includes('system') ||
          cls.includes('ai');

        if (isUserSide && !isBotSide && el.innerText?.trim()) {
          if (!fallbackNodes.includes(el)) {
            fallbackNodes.push(el);
          }
        }
      });

      validElements = fallbackNodes.filter((el) => {
        if (el.offsetParent === null && getComputedStyle(el).display === 'none') {
          return false;
        }
        return !fallbackNodes.some((other) => other !== el && other.contains(el));
      });
    }

    const items: QuestionItem[] = [];
    const ignoreKeywords = ['内容由ai生成', '仅供参考', '由 ai 生成', '免责声明', '下载元宝', '换一换'];
    let lastText = '';

    validElements.forEach((el) => {
      const textEl =
        (el.querySelector('.hyc-content-text, [class*="content-text"], [class*="user-content"]') as HTMLElement) || el;
      const text = this.cleanNodeText(textEl);

      if (!text) return;

      const lowerText = text.toLowerCase();
      if (ignoreKeywords.some((kw) => lowerText.includes(kw))) {
        return;
      }

      if (text === lastText) {
        return;
      }

      lastText = text;
      items.push(this.createQuestionItem(el, text, items.length));
    });

    return items;
  }
}

