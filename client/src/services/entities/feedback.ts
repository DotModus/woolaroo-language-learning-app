export enum FeedbackType {
  IncorrectTranslation = 'incorrect',
  OffensiveTranslation = 'offensive',
  SuggestedTranslation = 'offensive',
  Other = 'Other'
}

export interface Feedback {
  word: string;
  language: string;
  englishWord: string;
  nativeWord: string;
  nativeLanguage: string;
  transliteration: string;
  suggestedTranslation: string;
  suggestedTransliteration: string;
  recording: Blob|null;
  types: FeedbackType[];
  content: string;
}
