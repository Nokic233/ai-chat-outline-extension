import { BaseAdapter } from './base';
import { QuestionItem } from '../types';

export class KimiAdapter extends BaseAdapter {
  name = 'Kimi';

  isMatch(url: string): boolean {
    return url.includes('kimi.moonshot.cn') || url.includes('kimi.com') || url.includes('kimi.ai');
  }

  override getScrollContainer(): HTMLElement | Window {
    // 优先匹配 Kimi 专属聊天滚动主视图 .chat-detail-main
    const chatDetailMain = document.querySelector('.chat-detail-main, [class*="chat-detail-main"]') as HTMLElement;
    if (chatDetailMain && chatDetailMain.clientHeight > 100) {
      return chatDetailMain;
    }
    return super.getScrollContainer();
  }

  getUserMessages(): QuestionItem[] {
    const selectors = [
      '.chat-content-item-user',
      '[class*="chat-content-item-user"]',
      '.segment-user',
      '[class*="segment-user"]',
      '[class*="segment_user"]',
      '[class*="user-segment"]',
      '[class*="user_segment"]',
      '[data-testid*="user-message"]',
      '[class*="user-message"]',
      '[class*="userMessage"]',
      '[class*="chat-segment-user"]',
      '[class*="chat-item-user"]',
      '[class*="user-content"]',
      '[data-role="user"]'
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

    // 1. 过滤并去重：只保留最外层的用户提问容器，防止嵌套节点导致重复项
    const validElements = elements.filter(el => {
      const parent = el.parentElement?.closest(selectors.join(','));
      return !parent;
    });

    const items: QuestionItem[] = [];

    validElements.forEach((el) => {
      // 2. 尝试定位文本内容节点
      const contentEl = (el.querySelector('.user-content, [class*="user-content"], [class*="content"], [class*="text"]') as HTMLElement) || el;
      
      // 3. 克隆节点并剔除“编辑”、“复制”、“分享”等按钮和工具栏节点
      const clone = contentEl.cloneNode(true) as HTMLElement;
      clone.querySelectorAll('[class*="action"], [class*="tool"], [class*="btn"], button, [class*="ops"], [class*="edit"]').forEach(node => node.remove());
      
      let text = (clone.innerText || clone.textContent || '').trim();
      
      // 4. 清理残留的操作按钮文本
      text = text.replace(/(编辑|复制|分享|Edit|Copy|Share)/g, '').trim();

      if (text.length > 0) {
        items.push(this.createQuestionItem(el, text, items.length));
      }
    });

    return items;
  }
}
