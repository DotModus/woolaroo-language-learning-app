import { Injectable } from '@angular/core';
import { getLogger } from '../util/logging';

export interface AxlParams {
  target_lang?: string;
  lang?: string;
  [key: string]: any;
}

@Injectable({
  providedIn: 'root'
})
export class AxlService {
  private logger = getLogger('AxlService');

  constructor() {}

  /**
   * Get AxL parameters from local storage
   */
  getAxlParams(): AxlParams | null {
    const storedParams = window.localStorage.getItem('URL_PARAMS');
    if (storedParams) {
      try {
        return JSON.parse(storedParams);
      } catch (e) {
        this.logger.error('Failed to parse AxL params from local storage', e);
        return null;
      }
    }
    return null;
  }

  /**
   * Check if AxL integration is available
   */
  isAxlAvailable(): boolean {
    return !!window.axl;
  }

  /**
   * Send a message to the AxL framework
   */
  postAxlMessage(type: string, payload: any): void {
    if (this.isAxlAvailable()) {
      window.axl.postMessage({
        type,
        payload
      });
    } else {
      this.logger.warn('Attempted to send message but AxL is not available');
    }
  }

sendAxlMessage(type: string, payload: any): void {
	// Send an event to Google Analytics.
	window.axl.sendMessage(type, { ...payload });
}


  /**
   * Update language parameters based on AxL data
   * This is a wrapper around the existing setLangParams functionality
   */
  updateLanguageParams(params: AxlParams): void {
    if (params?.target_lang || params?.lang) {
      const profile: any = JSON.parse(window.localStorage.getItem('profile') || '{}');
      let currentLanguage = window.localStorage.getItem('currentLanguage');

      if (profile) {
        profile.endangeredLanguage = params?.target_lang;
        profile.language = params?.lang;
        window.localStorage.setItem('profile', JSON.stringify(profile));
      }

      if (currentLanguage) {
        currentLanguage = params?.target_lang;
        window.localStorage.setItem('currentLanguage', currentLanguage);
      }

      window.localStorage.setItem('URL_PARAMS', JSON.stringify(params));

      this.logger.log('Language parameters updated from AxL');
    }
  }
}
