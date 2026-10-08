import { Message, ExtractedQuestion, CurriculumContext } from '../types';

export const HISTORY_STORAGE_KEY = 'shomi_chat_history_v1';
export const MAX_STORED_MESSAGES = 80;

export interface QuestionHistoryItem {
  id: string;
  userMessageId: string;
  botMessageId?: string;
  questionText: string;
  solutionText?: string;
  image?: string;
  extractedData?: ExtractedQuestion;
  curriculumContext?: CurriculumContext;
  timestamp: number;
}

/**
 * Safely saves messages to localStorage with QuotaExceeded fallback
 */
export function saveHistoryMessages(messages: Message[]): boolean {
  if (typeof window === 'undefined') return false;

  // Filter out transient or error limit messages if needed, keep real user & bot messages
  const cleanMessages = messages
    .filter(m => !m.id.startsWith('bot_limit_'))
    .slice(-MAX_STORED_MESSAGES);

  try {
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(cleanMessages));
    return true;
  } catch (e) {
    console.warn('LocalStorage quota warning, trimming image data from older messages...', e);
    try {
      // If quota exceeded, keep only recent images and keep extractedData / text for older ones
      const trimmed = cleanMessages.map((msg, index) => {
        // Keep image only for the last 3 user messages to save space
        if (msg.image && index < cleanMessages.length - 6) {
          const { image, ...rest } = msg;
          return rest as Message;
        }
        return msg;
      });

      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(trimmed));
      return true;
    } catch (err2) {
      console.error('Failed to save chat history to localStorage:', err2);
      return false;
    }
  }
}

/**
 * Loads saved messages from localStorage
 */
export function loadHistoryMessages(): Message[] {
  if (typeof window === 'undefined') return [];

  try {
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed as Message[];
    }
    return [];
  } catch (error) {
    console.error('Failed to load chat history from localStorage:', error);
    return [];
  }
}

/**
 * Clears saved question history
 */
export function clearHistoryMessages(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(HISTORY_STORAGE_KEY);
  } catch (e) {
    console.error('Error clearing history:', e);
  }
}

/**
 * Extracts question-answer pairs for history browsing and review
 */
export function extractQuestionPairs(messages: Message[]): QuestionHistoryItem[] {
  const items: QuestionHistoryItem[] = [];

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    if (msg.role === 'user') {
      // Find the subsequent assistant response
      let botMsg: Message | undefined;
      for (let j = i + 1; j < messages.length; j++) {
        if (messages[j].role === 'assistant') {
          botMsg = messages[j];
          break;
        } else if (messages[j].role === 'user') {
          // another user message before assistant
          break;
        }
      }

      const questionText = msg.extractedData?.extractedText 
        ? msg.extractedData.extractedText 
        : msg.content;

      items.push({
        id: msg.id,
        userMessageId: msg.id,
        botMessageId: botMsg?.id,
        questionText: questionText || 'سؤال بدون نص',
        solutionText: botMsg?.content,
        image: msg.image,
        extractedData: msg.extractedData,
        curriculumContext: msg.curriculumContext,
        timestamp: msg.timestamp || Date.now()
      });
    }
  }

  // Reverse so newest questions appear first
  return items.reverse();
}

/**
 * Removes a specific question and its corresponding answer from message list
 */
export function removeQuestionFromMessages(messages: Message[], userMsgId: string, botMsgId?: string): Message[] {
  return messages.filter(m => m.id !== userMsgId && (botMsgId ? m.id !== botMsgId : true));
}
