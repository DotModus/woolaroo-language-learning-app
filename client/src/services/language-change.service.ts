import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LanguageChangeService {
  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();

  constructor() {}

	setLoading(isLoading: boolean): void {
	  console.log("setLoading", isLoading);

    this.loadingSubject.next(isLoading);
  }

  getLoading(): boolean {
    return this.loadingSubject.value;
  }
}
