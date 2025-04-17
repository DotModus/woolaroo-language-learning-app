import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { I18nService } from '../../../i18n/i18n.service';
import { EndangeredLanguage, EndangeredLanguageService } from '../../../services/endangered-language';

interface Region {
  code: string;
  name: string;
  languages: EndangeredLanguage[];
}

@Component({
  selector: 'app-list-languages',
  templateUrl: './list-languages.html',
  styleUrls: ['./list-languages.scss']
})
export class ListLanguagesPageComponent implements OnInit {
  public selectedRegion: Region | null = null;
  public regions: Region[] = [];
  public allLanguages: EndangeredLanguage[] = [];

  private _currentLanguageIndex = 0;
  public get currentLanguageIndex() { return this._currentLanguageIndex; }
  public set currentLanguageIndex(value: number) {
    this._currentLanguageIndex = value;
    const state = history.state;
    state.languageIndex = value;
    history.replaceState(state, '');
  }

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private i18nService: I18nService,
    private endangeredLanguageService: EndangeredLanguageService
  ) {
    this._currentLanguageIndex = history.state.languageIndex || 0;
  }

  ngOnInit() {
    this.initializeRegions();
  }

  private initializeRegions() {
    // Get all languages and sort them
    this.allLanguages = this._sortLanguages(this.endangeredLanguageService.allLanguages);

    // Get all regions from the service
    const allRegions = this.endangeredLanguageService.displayRegions;

    // Create region objects with their languages
    this.regions = allRegions.map(region => ({
      code: region.code,
      name: region.name,
      languages: this.allLanguages.filter(
        lang => (typeof lang.region === 'string' ? lang.region.toLowerCase() : lang.region) === region.code.toLowerCase()
      )
    }));


  }

  private _sortLanguages(languages: EndangeredLanguage[]): EndangeredLanguage[] {
    return languages.sort((a, b) => {
      if (a.name < b.name) return -1;
      if (a.name > b.name) return 1;
      return 0;
    });
  }

  onLanguageChanged(index: number) {
    this.currentLanguageIndex = index;
  }

  onCloseClick(ev: MouseEvent) {
    ev.stopPropagation();
    this.router.navigate([".."], { relativeTo: this.route, replaceUrl: true });
  }

  onLanguageClick(code: string) {
    this.router.navigate(['languages', code], { replaceUrl: true });
  }

  onRegionSelect(region: Region) {
    this.selectedRegion = region;
  }

  onRegionBack() {
    this.selectedRegion = null;
  }

  prefixImageUrl(sampleWordImageURL: string): string {
    return `${this.endangeredLanguageService.imageAssetsURL}${sampleWordImageURL}`;
  }

  getTranslatedText(key: string): string {
    return this.i18nService.getTranslation(key);
  }
}
