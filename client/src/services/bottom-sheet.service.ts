import { Injectable } from '@angular/core';
import { MatBottomSheet, MatBottomSheetConfig } from '@angular/material/bottom-sheet';
import { ChangeLanguagePageComponent } from '../pages/languages/change/change-language';
import { ViewLanguagePageComponent } from '../pages/languages/view/view-language';
import { Subject } from 'rxjs';
import { EndangeredLanguageService } from './endangered-language';

@Injectable({
  providedIn: 'root'
})
export class BottomSheetService {
  private languageChangedSubject = new Subject<void>();
  languageChanged$ = this.languageChangedSubject.asObservable();
  private currentBottomSheetRef: any;

  private bottomSheetConfig: MatBottomSheetConfig = {
    panelClass: ['language-bottom-sheet'],
    hasBackdrop: true,
    closeOnNavigation: true
  };

  constructor(
    private bottomSheet: MatBottomSheet,
    private endangeredLanguageService: EndangeredLanguageService
  ) {}

  openChangeLanguage() {
    const ref = this.bottomSheet.open(ChangeLanguagePageComponent, this.bottomSheetConfig);
    ref.afterDismissed().subscribe((result) => {
      if (result?.languageChanged) {
        this.languageChangedSubject.next();
      }
    });
  }

  openViewLanguage() {
    this.bottomSheet.open(ViewLanguagePageComponent, {
      ...this.bottomSheetConfig,
      data: {
        language: this.endangeredLanguageService.currentLanguage
      }
    });
  }

  dismiss() {
    if (this.currentBottomSheetRef) {
      this.currentBottomSheetRef.dismiss();
    }
  }
}
