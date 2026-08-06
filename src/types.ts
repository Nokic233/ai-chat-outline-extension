export interface QuestionItem {
  id: string;
  text: string;
  fullText: string;
  element: HTMLElement;
  index: number;
}

export interface ChatAdapter {
  name: string;
  isMatch(url: string): boolean;
  getUserMessages(): QuestionItem[];
  getScrollContainer(): HTMLElement | Window;
  observe(callback: () => void): () => void;
  isDarkMode?(): boolean;
  scrollToQuestion(item: QuestionItem, allItems: QuestionItem[], prevActiveIndex: number): Promise<void>;
}



