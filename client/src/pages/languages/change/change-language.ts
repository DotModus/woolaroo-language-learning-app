import { AfterViewInit, Component, Inject, ViewChild } from "@angular/core";
import { Router } from "@angular/router";
import { AppRoutes } from "../../../app/routes";
import { CameraPreviewComponent } from "../../../components/camera-preview/camera-preview";
import { I18nService, Language } from "../../../i18n/i18n.service";
import {
	EndangeredLanguage,
	EndangeredLanguageService,
} from "../../../services/endangered-language";
import { IProfileService, PROFILE_SERVICE } from "../../../services/profile";
import { loadCapturePageURL } from "../../../util/camera";
import { getLogger } from "../../../util/logging";
import { AxlService } from "../../../services/axl.service";
import AxL from "../../../external/axl";
import { MatBottomSheetRef } from '@angular/material/bottom-sheet';

interface PersistHistory {
	image: Blob;
	imageURL: string;
	words: string[];
	selectedWordIndex: number;
}

const logger = getLogger("ChangeLanguagePageComponent");

@Component({
	selector: "app-change-language",
	templateUrl: "./change-language.html",
	styleUrls: ["./change-language.scss"],
})
export class ChangeLanguagePageComponent implements AfterViewInit {
	showResults = true;
	selectedRegion = '';
	selectedLanguageCode = '';
	private allLanguages: EndangeredLanguage[] = [];
	private _persistedHistory: PersistHistory = {} as PersistHistory;

	public get allRegions(): { name: string; code: string }[] {
		return this.getRegs();
	}

	private getRegs = () => {
		return this.endangeredLanguageService.displayRegions;
	};

	public get endangeredLanguages(): EndangeredLanguage[] {
		return this.endangeredLanguageService.languages;
	}

	@ViewChild(CameraPreviewComponent)
	private cameraPreview: CameraPreviewComponent | null = null;

	public get uiLanguages(): Language[] {
		return this.i18nService.languages;
	}

	public get imageUrl(): string | null {
		return this._persistedHistory.imageURL || null;
	}

	private _currentUILanguageIndex = 0;
	public get currentUILanguageIndex(): number {
		return this._currentUILanguageIndex;
	}

	private _currentEndangeredLanguageIndex = 0;
	public get currentEndangeredLanguageIndex(): number {
		return this._currentEndangeredLanguageIndex;
	}

	public get currentEndangeredLanguageDescriptionKey(): string {
		const code =
			this.endangeredLanguages[this._currentEndangeredLanguageIndex]
				?.code;
		return `shortDescription_${code}`;
	}

	public get currentEndangeredLanguageCode(): string {
		const code =
			this.endangeredLanguages[this._currentEndangeredLanguageIndex]
				?.code;
		return code;
	}

	constructor(
		private router: Router,
		public i18nService: I18nService,
		private axl: AxlService,
		@Inject(PROFILE_SERVICE) private profileService: IProfileService,
		private endangeredLanguageService: EndangeredLanguageService,
		private bottomSheetRef: MatBottomSheetRef<ChangeLanguagePageComponent>
	) {
		this._currentUILanguageIndex = this.i18nService.languages.indexOf(
			this.i18nService.currentLanguage
		);

		this._currentEndangeredLanguageIndex =
			this.endangeredLanguageService.languages.indexOf(
				this.endangeredLanguageService.currentLanguage
			);

		this.allLanguages = this._sortLanguages(
			this.endangeredLanguageService.allLanguages
		);

		// Set the current language and its region
		const currentLanguage = this.endangeredLanguageService.currentLanguage;
		if (currentLanguage) {
			this.selectedLanguageCode = currentLanguage.code;
			const region = this.allRegions.find(r => r.code === currentLanguage.region);
			if (region) {
				this.selectedRegion = region.name;
				this.onSearchLanguage({ region: region.code, language: null });
			} else {
				this.onSearchLanguage({ region: 'all', language: null });
			}
		}
	}

	ngOnInit() {
		this._persistedHistory = history.state;
	}

	ngAfterViewInit() {
		if (!this.cameraPreview) {
			logger.error("Camera preview not found");
		} else {
			this.cameraPreview.start().then(
				() => logger.log("Camera started"),
				(err) => logger.warn("Error starting camera", err)
			);
		}
	}

	onUILanguageChanged(index: number) {
		this._currentUILanguageIndex = index;
		this.i18nService.setLanguage(this.i18nService.languages[index]?.code);
		this.axl.sendAxlMessage(AxL.ChildToHost.TRACK, {
			action: `select primary language`,
			label: `${this.i18nService.languages[index]?.name}`
		});
	}

	onEndangeredLanguageChanged(index: number) {
		let _index = index;

		if (index > this.endangeredLanguages.length - 1) {
			_index = 0;
		}

		this._currentEndangeredLanguageIndex = _index;
		this.endangeredLanguageService.setLanguage(
			this.endangeredLanguageService.languages[_index]?.code
		);

		this.saveSelectedLanguages().finally(() => {
			this.bottomSheetRef.dismiss();
		});
	}

	onCloseClick() {
		loadCapturePageURL().then(
			(url) => this.router.navigateByUrl(url, {replaceUrl: true}),
			() => this.router.navigateByUrl(AppRoutes.CaptureImage, {replaceUrl: true})
		);
	}

	onNextClick() {
		this.saveSelectedLanguages().finally(() => {
			loadCapturePageURL().then(
				() => {
					this.router.navigateByUrl(AppRoutes.Translate, {
						state: history.state,
						replaceUrl: true
					});
				},
				(url) => {
					this.router.navigateByUrl(url, {replaceUrl: true});
				}
			);
		});
	}

	async saveSelectedLanguages() {
		const profile = await this.profileService.loadProfile();
		profile.language =
			this.i18nService.languages[this.currentUILanguageIndex]?.code;
		profile.endangeredLanguage =
			this.endangeredLanguageService.languages[
				this.currentEndangeredLanguageIndex
			]?.code;
		await this.profileService.saveProfile(profile);

		this.axl.sendAxlMessage(AxL.ChildToHost.TRACK, { action: 'choose language', label: this.endangeredLanguageService.languages[this.currentEndangeredLanguageIndex]?.name, value: this.endangeredLanguageService.languages[this.currentEndangeredLanguageIndex]?.code  });
	}

	private _sortLanguages(
		languages: EndangeredLanguage[]
	): EndangeredLanguage[] {
		return languages.sort((a, b) => {
			if (a.name < b.name) {
				return -1;
			} else if (a.name > b.name) {
				return 1;
			} else {
				return 0;
			}
		});
	}

	onSearchLanguage(e: any) {
		let _endangeredLanguages = this.allLanguages;

		if (e.region === "all" && e.language === null) {
			_endangeredLanguages = this.allLanguages;
			this.selectedRegion = 'All Regions';
			this.axl.sendAxlMessage(AxL.ChildToHost.TRACK, { action: `choose region - all` });
		} else if (
			e.region !== "none" &&
			e.region !== "" &&
			e.region !== null
		) {
			_endangeredLanguages = this.allLanguages.filter(
				(lan) => (typeof lan.region === 'string' ? lan.region.toLowerCase() : lan.region) === e.region.toLowerCase()
			);
			this.selectedRegion = this.allRegions.find(r => r.code === e.region)?.name || e.region;
			this.axl.sendAxlMessage(AxL.ChildToHost.TRACK, { action: `choose region - ${e.region.toLowerCase()}` });
		} else if (
			e.language !== "none" &&
			e.language !== "" &&
			e.language !== null
		) {
			_endangeredLanguages = this.allLanguages.filter((lan) =>
				lan.name.includes(e.language)
			);
		}

		if (_endangeredLanguages.length === 0) {
			_endangeredLanguages = this.allLanguages;
		}

		this.endangeredLanguageService.setLanguages(_endangeredLanguages);

		this.showResults = true;
	}

	onSubmitFeedbackClick() {
		this.axl.sendAxlMessage(AxL.ChildToHost.TRACK, { action: "click share feedback button" });
		this.router.createUrlTree([], {});
	}

	getLanguageDirection() {
		if (!this.i18nService.currentLanguage) {
			return 'ltr';
		}
		return this.i18nService.currentLanguage.direction;
	}
}
