import { Injectable } from '@angular/core';
import { IFeedbackService } from '../feedback';
import { Feedback } from '../entities/feedback';
import {getLogger} from 'util/logging';

const logger = getLogger('MockFeedbackService');

@Injectable()
export class MockFeedbackService implements IFeedbackService {
  public sendFeedback(feedback: Feedback): Promise<any> {
    return new Promise((resolve) => {
      setTimeout(() => {
        logger.log('Submitted feedback: ' + feedback.content);
        resolve();
      }, 2000);
    });
  }

  public addWord(feedback: Feedback): Promise<any> {
    return new Promise((resolve) => {
      setTimeout(() => {
        logger.log('Added word: ' + feedback.englishWord);
        resolve();
      }, 2000);
    });
  }
}
