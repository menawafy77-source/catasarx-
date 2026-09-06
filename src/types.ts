export interface ExtractedQuestion {
  extractedText: string;
  subject?: string;
  grade?: string;
  hasDiagram?: boolean;
  diagramDescription?: string;
}

export type ProcessingPhase = 'idle' | 'ocr' | 'answering';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  image?: string;
  extractedData?: ExtractedQuestion;
  processingPhase?: ProcessingPhase;
  timestamp?: number;
}
