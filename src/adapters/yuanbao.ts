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
      // 优先精准匹配用户侧整体气泡容器
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
      '[data-author="user"]'
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

    // 智能降级搜索：仅在精准选择器没匹配到任何节点时使用
    if (elements.length === 0) {
      const candidates = Array.from(
        document.querySelectorAll('div[class*="bubble"], div[class*="message"], div[class*="chat-record"]')
      ) as HTMLElement[];

      candidates.forEach(el => {
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
          if (!elements.includes(el)) {
            elements.push(el);
          }
        }
      });
    }

    // 1. 精确防嵌套去重：如果有任何其他被选中的元素包含该元素，则该元素为内层子节点，予以剔除
    const validElements = elements.filter(el => {
      // 过滤隐藏节点
      if (el.offsetParent === null && getComputedStyle(el).display === 'none') {
        return false;
      }
      const isChild = elements.some(other => other !== el && other.contains(el));
      return !isChild;
    });

    const items: QuestionItem[] = [];
    const ignoreKeywords = [
      '内容由ai生成',
      '仅供参考',
      '由 ai 生成',
      '免责声明',
      '下载元宝',
      '换一换'
    ];

    let lastText = '';

    validElements.forEach((el) => {
      // 2. 提取气泡内的提问纯文本
      const textEl = (el.querySelector('.hyc-content-text, [class*="content-text"], [class*="user-content"]') as HTMLElement) || el;
      
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

      let text = (clone.innerText || clone.textContent || '').trim();
      text = text.replace(/\s+/g, ' ');

      if (!text) return;

      // 3. 过滤系统提示词/免责短语
      const lowerText = text.toLowerCase();
      if (ignoreKeywords.some(kw => lowerText.includes(kw))) {
        return;
      }

      // 4. 连续相同提问去重（解决页面镜像节点/视图渲染导致的双重问题）
      if (text === lastText) {
        return;
      }

      lastText = text;
      items.push(this.createQuestionItem(el, text, items.length));
    });

    return items;
  }
}
