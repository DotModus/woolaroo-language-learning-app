import { Component } from "@angular/core";
import { I18nService } from "../../../i18n/i18n.service";
import {
	EndangeredLanguage,
	EndangeredLanguageService,
} from "../../../services/endangered-language";
import { ActivatedRoute, ParamMap, Router } from "@angular/router";
import { AppRoutes } from "../../../app/routes";

@Component({
	selector: "app-view-language",
	templateUrl: "./view-language.html",
	styleUrls: ["./view-language.scss"],
})
export class ViewLanguagePageComponent {
	public get endangeredLanguages(): EndangeredLanguage[] {
		return this.endangeredLanguageService.languages;
	}
	public get otherLanguages(): EndangeredLanguage[] {
		const currentLang = this.language;
		if (!currentLang) {
			return this.endangeredLanguageService.languages || [];
		}
		const filtered = this.endangeredLanguageService.languages?.filter(
			(lang) => lang.code !== currentLang.code
		) || [];
		return filtered;
	}

	public get languageImage(): string {
		return this.language
			? `${this.endangeredLanguageService.imageAssetsURL}${this.language.sampleWordImageURL}`
			: "";
	}

	public get allRegions(): { name: string; code: string }[] {
		return this.endangeredLanguageService.displayRegions;
	}

	public getRegionName(regionCode: string): string {
		const region = this.allRegions.find(r => r.code === regionCode);
		return region?.name || regionCode;
	}

	public language: EndangeredLanguage | null;

	constructor(
		private route: ActivatedRoute,
		private router: Router,
		private i18nService: I18nService,
		private endangeredLanguageService: EndangeredLanguageService
	) {
		this.language = null;
		this.route.paramMap.subscribe((params: ParamMap) => {

			this.language =
				this.endangeredLanguageService.languages.find(
					(lang) => lang.code === params.get("id")
				) || null;

		});
	}

	onExploreLanguageClick(url: string) {
		if (url) {
			window.open(url);
		}
	}

	onLanguageClick(code: string) {
		window.scrollTo(0, 0);
		this.router.navigate([AppRoutes.ListLanguages, code]);
	}

	onBackClick(ev: MouseEvent) {
		ev.stopPropagation();
		this.router.navigate([".."], {relativeTo: this.route})
	}

	navigateToCapture(ev: MouseEvent) {
		ev.stopPropagation();
		this.router.navigate([`/${AppRoutes.CaptureImage}`]);
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
}
