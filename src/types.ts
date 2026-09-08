export type SecondaryGrade = '1st_secondary' | '2nd_secondary' | '3rd_secondary' | 'other_grades';

export type BaccalaureateTrack =
  | 'preparatory_general'
  | 'medical_and_life_sciences'
  | 'engineering_and_cs'
  | 'business'
  | 'arts_and_humanities'
  | 'general_all';

export type SubjectLevelType = 'standard' | 'advanced';

export interface CurriculumContext {
  grade: SecondaryGrade;
  track: BaccalaureateTrack;
  subject: string;
  level_type: SubjectLevelType;
  topic?: string;
}

export interface ExtractedQuestion {
  extractedText: string;
  subject?: string;
  grade?: string;
  track?: string;
  level_type?: SubjectLevelType;
  topic?: string;
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
  curriculumContext?: CurriculumContext;
  processingPhase?: ProcessingPhase;
  timestamp?: number;
}

export interface UserCredits {
  questionsLeft: number;
  totalQuestionsAsked: number;
  initialFreeQuota: number;
  isUnlimited: boolean;
  history: {
    type: 'free_initial' | 'voucher' | 'wallet_vodafone' | 'fawry' | 'instapay';
    amount: number;
    date: number;
    description: string;
  }[];
}

export interface RechargePlan {
  id: string;
  name: string;
  questionsCount: number;
  priceEGP: number;
  badge?: string;
  popular?: boolean;
  features: string[];
}
