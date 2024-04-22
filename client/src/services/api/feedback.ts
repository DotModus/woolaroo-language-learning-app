import { Inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { IFeedbackService, FEEDBACK_CONFIG } from 'services/feedback';
import { Feedback } from 'services/entities/feedback';
import {getLogger} from 'util/logging';

interface APIFeedbackConfig {
  addWordAudioEndpointURL: string;
  addWordEndpointURL: string;
  feedbackEndpointURL: string;
}

const logger = getLogger('APIFeedbackService');

@Injectable()
export class APIFeedbackService implements IFeedbackService {
  public constructor(
    private http: HttpClient,
    @Inject(FEEDBACK_CONFIG) private config: APIFeedbackConfig) {
  }

  public async sendFeedback(feedback: Feedback): Promise<any> {
    let soundUrl: string|null = null;
    if (feedback.recording) {
      logger.log('Sending audio');
      soundUrl = await this.http.post(this.config.addWordAudioEndpointURL, feedback.recording, { responseType: 'text' }).toPromise();
    }
    logger.log('Sending feedback');
    const requestBody = {
      primary_word: feedback.word ? feedback.word.toLowerCase() : feedback.word,
      english_word: feedback.englishWord ? feedback.englishWord.toLowerCase() : feedback.englishWord,
      translation: feedback.nativeWord ? feedback.nativeWord.toLowerCase() : feedback.nativeWord,
      language: feedback.language,
      native_language: feedback.nativeLanguage,
      transliteration: feedback.transliteration ? feedback.transliteration.toLowerCase() : feedback.transliteration,
      suggested_translation: feedback.suggestedTranslation ? feedback.suggestedTranslation.toLowerCase() : feedback.suggestedTranslation,
      suggested_transliteration: feedback.suggestedTransliteration ? feedback.suggestedTransliteration.toLowerCase() : feedback.suggestedTransliteration,
      sound_link: soundUrl,
      types: feedback.types,
      content: feedback.content
    };
    await this.http.post(this.config.feedbackEndpointURL, requestBody, { responseType: 'text' }).toPromise();
    logger.log('Feedback sent');
  }

  public async addWord(feedback: Feedback): Promise<any> {
    let soundUrl: string|null = null;
    if (feedback.recording) {
      logger.log('Sending audio');
      soundUrl = await this.http.post(this.config.addWordAudioEndpointURL, feedback.recording, { responseType: 'text' }).toPromise();
    }
    logger.log('Adding word');
    const requestBody = {
      primary_word: feedback.word ? feedback.word.toLowerCase() : feedback.word,
      english_word: feedback.englishWord ? feedback.englishWord.toLowerCase() : feedback.englishWord,
      translation: feedback.nativeWord ? feedback.nativeWord.toLowerCase() : feedback.nativeWord,
      language: feedback.language,
      native_language: feedback.nativeLanguage,
      transliteration: feedback.transliteration ? feedback.transliteration.toLowerCase() : feedback.transliteration,
      suggested_translation: feedback.suggestedTranslation ? feedback.suggestedTranslation.toLowerCase() : feedback.suggestedTranslation,
      suggested_transliteration: feedback.suggestedTransliteration ? feedback.suggestedTransliteration.toLowerCase() : feedback.suggestedTransliteration,
      sound_link: soundUrl,
      types: ["suggested"],
      content: ''
    };
    await this.http.post(this.config.addWordEndpointURL, requestBody, { responseType: 'text' }).toPromise();
    logger.log('Word added');
  }
}
