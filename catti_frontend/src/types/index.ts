export interface TranslationRequest {
  source_text: string;
  user_translation: string;
  provider: 'deepseek' | 'mimo';
  api_key: string;
  language: 'en' | 'zh';
}

export interface EvaluationItem {
  source_snippet: string;
  user_translation: string;
  error_type: 'Major Mistranslation' | 'Omission' | 'Grammar/Spelling' | 'Inappropriate Wording';
  penalty: number;
  suggestion: string;
}

export interface GlossaryItem {
  word: string;
  pos: string;
  definition: string;
  example: string;
}

export interface GraderResponse {
  final_score: number;
  evaluations: EvaluationItem[];
  gold_standard: string;
  glossary: GlossaryItem[];
}

// Interpretation Module Types
export interface TrueFalseQuestion {
  id: string;
  statement: string;
  answer: 'True' | 'False';
  distractor_logic: string;
  timestamp_ref?: string;
}

export interface MultipleChoiceQuestion {
  id: string;
  question: string;
  options: string[];
  correct_answer: string;
  distractor_logic: string;
}

export interface SummaryRubric {
  source_word_count: number;
  required_word_count_target: number;
  key_scoring_points: string[];
}

export interface ComprehensiveExamData {
  true_or_false: TrueFalseQuestion[];
  multiple_choice_short: MultipleChoiceQuestion[];
  multiple_choice_passage: MultipleChoiceQuestion[];
  summary_rubric: SummaryRubric;
}

export interface Chunk {
  id: string;
  text: string;
  start_time?: string;
  end_time?: string;
}

export interface PracticeExamData {
  chunks: Chunk[];
}

export interface GenerateExamRequest {
  exam_type: '口译综合能力' | '口译实务';
  transcript: string;
  provider: 'deepseek' | 'mimo';
  api_key: string;
}

export interface GenerateExamResponse {
  exam_type: string;
  audio_meta: {
    duration: number;
    word_count: number;
  };
  questions?: ComprehensiveExamData;
  practice_data?: PracticeExamData;
}

// Written Comprehensive Module Types
export interface VocabGrammarQuestion {
  id: number;
  type: "vocab_grammar";
  stem: string;
  options: string[];
  correct: number;
  explanation: string;
}

export interface ReadingQuestion {
  id: number;
  stem: string;
  options: string[];
  correct: number;
  explanation: string;
  location: string;
}

export interface ReadingPassage {
  passageId: number;
  title: string;
  content: string;
  questions: ReadingQuestion[];
}

export interface ClozeBlank {
  position: number;
  options: string[];
  correct: number;
  explanation: string;
}

export interface ClozePassage {
  passageId: number;
  content: string;
  blanks: ClozeBlank[];
}

export interface WrittenCompExamData {
  vocab_grammar?: { questions: VocabGrammarQuestion[] };
  reading?: { passages: ReadingPassage[] };
  cloze?: { passage: ClozePassage };
}

export interface GenerateWrittenCompRequest {
  vocab_text: string;
  reading_text: string;
  cloze_text: string;
  provider: 'deepseek' | 'mimo';
  api_key: string;
}

export interface GenerateWrittenCompResponse {
  exam_type: string;
  data: WrittenCompExamData;
}
