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

navigateExternalLink(type: string, url: string): void {
	window.axl.sendMessage(type, url);
}

}
