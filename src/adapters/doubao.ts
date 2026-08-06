import { BaseAdapter } from './base';
import { QuestionItem } from '../types';

export class DoubaoAdapter extends BaseAdapter {
  name = 'Doubao';

  isMatch(url: string): boolean {
    return url.includes('doubao.com');
  }

  override getScrollContainer(): HTMLElement | Window {
    // 优先寻找豆包的专属聊天滚动容器
    const scroller = document.querySelector('.scroller, [class*="v_list_scroller"], [class*="scroller"]') as HTMLElement;
    if (scroller && scroller.clientHeight > 100) {
      return scroller;
    }
    return super.getScrollContainer();
  }

  getUserMessages(): QuestionItem[] {
    const selectors = [
      '.bg-g-send-msg-bubble-bg',
      '[class*="send-msg-bubble"]',
      '[class*="bubble-bg"]',
      '[class*="user-message"]',
      '[class*="userMessage"]',
      '[class*="bubble-user"]',
      '[class*="user_bubble"]',
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

    // 1. 过滤去重：只保留最外层的用户提问容器，避免嵌套节点重复
    const validElements = elements.filter(el => {
      const parent = el.parentElement?.closest(selectors.join(','));
      return !parent;
    });

    const items: QuestionItem[] = [];

    validElements.forEach((el) => {
      // 2. 克隆节点并剔除工具栏、编辑按钮等无关元素
      const clone = el.cloneNode(true) as HTMLElement;
      clone.querySelectorAll('[class*="action"], [class*="tool"], [class*="btn"], button, [class*="ops"], [class*="edit"]').forEach(node => node.remove());

      let text = (clone.innerText || clone.textContent || '').trim();

      // 3. 清理残留操作按钮文本
      text = text.replace(/(编辑|复制|分享|Edit|Copy|Share)/g, '').trim();

      if (text.length > 0) {
        items.push(this.createQuestionItem(el, text, items.length));
      }
    });

    return items;
  }
}
