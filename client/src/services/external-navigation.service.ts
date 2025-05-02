import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class ExternalNavigationService {
  constructor(private router: Router) {}

  /**
   * Navigate to an external URL
   * @param url The external URL to navigate to
   * @param openInNewTab Whether to open in a new tab (default: true)
   */
  navigateToExternalUrl(url: string, openInNewTab: boolean = true): void {
    if (openInNewTab) {
      // Open in new tab with security attributes
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      // Handle as internal navigation if it's a relative URL
      if (url.startsWith('/')) {
        this.router.navigateByUrl(url);
      } else {
        // For absolute URLs, use window.location
        window.location.href = url;
      }
    }
  }
}
