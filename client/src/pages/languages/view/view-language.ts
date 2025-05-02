import { Component, OnInit, Inject, ChangeDetectorRef, OnDestroy, Optional } from '@angular/core';
import { MAT_BOTTOM_SHEET_DATA, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { I18nService } from "../../../i18n/i18n.service";
import { Router, ActivatedRoute, ParamMap } from '@angular/router';
import {
	EndangeredLanguage,
	EndangeredLanguageService,
} from "../../../services/endangered-language";
import { AppRoutes } from "../../../app/routes";
import { Subscription } from 'rxjs';
import { ExternalNavigationService } from '../../../services/external-navigation.service';

@Component({
	selector: 'app-view-language',
	templateUrl: './view-language.html',
	styleUrls: ['./view-language.scss']
})
export class ViewLanguagePageComponent implements OnInit, OnDestroy {
	public language: EndangeredLanguage | null = null;
	private _languageImage: string = '';
	private subscriptions: Subscription[] = [];
	public isBottomSheet: boolean = false;
	public i18nService: I18nService;

	constructor(
		@Inject(MAT_BOTTOM_SHEET_DATA) public data: any,
		i18nService: I18nService,
		private endangeredLanguageService: EndangeredLanguageService,
		private router: Router,
		private route: ActivatedRoute,
		private cdr: ChangeDetectorRef,
		private externalNavigationService: ExternalNavigationService,
		@Optional() private bottomSheetRef?: MatBottomSheetRef<ViewLanguagePageComponent>
	) {
		this.i18nService = i18nService;
		this.isBottomSheet = !!bottomSheetRef;

		// If we're in a bottom sheet, use the language from the data
		if (this.isBottomSheet && data?.language) {
			this.language = data.language;
		}
	}

	ngOnInit() {
		// If we're in the drawer and don't have a language yet, get it from the current language service
		if (this.isBottomSheet && !this.language) {
			this.language = this.endangeredLanguageService.currentLanguage;
		} else {
			// Subscribe to route params to handle language changes
			this.subscriptions.push(
				this.route.paramMap.subscribe((params: ParamMap) => {
					const languageCode = params.get("id");
					if (languageCode) {
						// Set the current language in the service
						this.endangeredLanguageService.setLanguage(languageCode);
						// Get the language from the service
						this.language = this.endangeredLanguageService.languages.find(
							(lang) => lang.code === languageCode
						) || null;
						// Force change detection to update the view
						this.cdr.detectChanges();
					}
				})
			);
		}
		this._languageImage = this.endangeredLanguageService.imageAssetsURL;
	}

	ngOnDestroy() {
		this.subscriptions.forEach(subscription => subscription.unsubscribe());
	}

	get languageImage(): string {
		return this.language
			? `${this._languageImage}${this.language.sampleWordImageURL}`
			: "";
	}

	onExploreLanguageClick(url: string): void {
		this.externalNavigationService.navigateToExternalUrl(url);
	}

	onLanguageClick(code: string) {
		if (this.isBottomSheet) {
			this.bottomSheetRef?.dismiss();
		}
		this.router.navigate(['languages', code], { replaceUrl: true });
	}

	onBackClick(ev: MouseEvent) {
		ev.stopPropagation();
		if (this.isBottomSheet && this.bottomSheetRef) {
			this.bottomSheetRef.dismiss();
		} else {
			this.router.navigate([".."], {relativeTo: this.route, replaceUrl: true});
		}
	}

	navigateToCapture(ev: MouseEvent) {
		ev.stopPropagation();
		if (this.isBottomSheet && this.bottomSheetRef) {
			this.bottomSheetRef.dismiss();
		}
		this.router.navigate([`/${AppRoutes.CaptureImage}`], {replaceUrl: true});
	}

	prefixImageUrl(sampleWordImageURL: string): string {
		return `${this.endangeredLanguageService.imageAssetsURL}${sampleWordImageURL}`;
	}

	getSameRegionLanguages(): EndangeredLanguage[] {
		if (!this.language) {
			return [];
		}

		// Find languages that share the same region as the current language
		const sameRegionLanguages = this.endangeredLanguageService.languages.filter(
			(lang) => lang.region === this.language?.region && lang.code !== this.language?.code
		);

		// Limit to max 10 languages to prevent performance issues
		return sameRegionLanguages.slice(0, 10);
	}

	getRegionName(): string {
		const i18nLanguage = this.i18nService.currentLanguage.code
		const displayRegion =  this.language.displayRegions[i18nLanguage];

		return displayRegion ?? '';
	}

	getLanguageShortDescription(): string {
		const i18nLanguage = this.i18nService.currentLanguage.code

		const description = this.language.shortDescriptions[i18nLanguage];

		return description ?? '';
	}

	getLanguageDescription(): string {
		const i18nLanguage = this.i18nService.currentLanguage.code

		const description = this.language.descriptions[i18nLanguage];

		return description ?? '';
	}
}
