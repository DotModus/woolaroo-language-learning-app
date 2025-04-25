import { HttpClient } from "@angular/common/http";
import {
	Component,
	Inject,
	InjectionToken,
	NgZone,
	OnDestroy,
	OnInit,
} from "@angular/core";
import {
	MAT_DIALOG_DATA,
	MatDialog,
	MatDialogRef
} from "@angular/material/dialog";
import { Router } from "@angular/router";
import { AppRoutes } from "../../app/routes";
import { LoadingPopUpComponent } from "../../components/loading-popup/loading-popup";
import { I18nService } from "../../i18n/i18n.service";
import { ANALYTICS_SERVICE, IAnalyticsService } from "../../services/analytics";
import { EndangeredLanguageService } from "../../services/endangered-language";
import {
	Translation,
	WordTranslation,
} from "../../services/entities/translation";
import { ImageRenderingService } from "../../services/image-rendering";
import { SessionService } from "../../services/session";
import {
	ITranslationService,
	TRANSLATION_SERVICE,
} from "../../services/translation";
import { loadCapturePageURL } from "../../util/camera";
import { NotSupportedError } from "../../util/errors";
import { downloadFile } from "../../util/file";
import { validateImageData, validateImageURL } from "../../util/image";
import { getLogger } from "../../util/logging";
import { isMobileDevice } from "../../util/platform";
import { share } from "../../util/share";
import AxL from "../../external/axl";
import { AxlService } from "../../services/axl.service";
import { BottomSheetService } from '../../services/bottom-sheet.service';
import { LanguageChangeService } from '../../services/language-change.service';

const logger = getLogger("TranslatePageComponent");

interface TranslatePageConfig {
	debugImageUrl?: string;
	debugWords?: string[];
}

interface PersistHistory {
	image: Blob;
	imageURL: string;
	words: string[];
	selectedWordIndex: number;
}

class WordsNotFoundError extends Error {}

export const TRANSLATE_PAGE_CONFIG = new InjectionToken<TranslatePageConfig>(
	"Translate page config"
);

export interface DialogData {
	image: Blob;
	filename: string;
}

@Component({
	selector: "app-download-dialog",
	templateUrl: "download-dialog.html",
	styleUrls: ["./translate.scss"],
})
export class DownnloadDialog {
	processing: boolean = false;
	private _uploadedFile: string = "";
	public get uploadedFile(): string {
		return this._uploadedFile;
	}

	linkCopied = false;

	constructor(
		@Inject(MAT_DIALOG_DATA) public data: DialogData,
		private http: HttpClient,
		private endangeredLanguageService: EndangeredLanguageService
	) {
		this._uploadImage(data);
	}

	private async _uploadImage(data: DialogData) {
		const formData = new FormData();
		formData.append("file", data.image);

		this.processing = true;

		const response = await this.http
			.post<any>(
				"https://woolaroo-b9v1uynn.uc.gateway.dev/upload_image",
				formData
			)
			.toPromise();

		this.processing = false;

		this._uploadedFile = `${this.endangeredLanguageService.imageAssetsURL}${response.filename}`;
	}

	copyLink() {
		navigator.clipboard.writeText(this._uploadedFile);
		this.linkCopied = true;
		setTimeout(() => {
			this.linkCopied = false;
		}, 3000);
	}

	download() {
		try {
			downloadFile(this.data.image, this.data.filename);
		} catch (err) {
			logger.warn("Error downloading image", err);
		}
	}
}

@Component({
	selector: "app-page-translate",
	templateUrl: "./translate.html",
	styleUrls: ["./translate.scss"],
})
export class TranslatePageComponent implements OnInit, OnDestroy {
	private _sharedImage: Blob | null = null;
	public backgroundImageData: Blob | null = null;
	public backgroundImageURL: string | null = null;
	public selectedWord: Translation | null = null;
	public defaultSelectedWordIndex = -1;
	public translations: WordTranslation[] | null = null;
	private _persistedHistory: PersistHistory = {} as PersistHistory;
	private _downloadData: DialogData = {} as DialogData;
	public sidenavOpen = false;
	public languageChangeService: LanguageChangeService;
	private originalWords: string[] = [];

	public get currentLanguage(): string {
		const fullName = this.endangeredLanguageService.currentLanguage.name;
		if (isMobileDevice() && fullName.length > 10) {
			return fullName.substring(0, 10) + '...';
		}
		return fullName;
	}

	public get deviceSupported(): boolean {
		return isMobileDevice();
	}

	constructor(
		@Inject(TRANSLATE_PAGE_CONFIG) private config: TranslatePageConfig,
		private http: HttpClient,
		private dialog: MatDialog,
		private router: Router,
		private zone: NgZone,
		private sessionService: SessionService,
		private i18n: I18nService,
		private axl: AxlService,
		private endangeredLanguageService: EndangeredLanguageService,
		@Inject(TRANSLATION_SERVICE)
		private translationService: ITranslationService,
		@Inject(ANALYTICS_SERVICE) private analyticsService: IAnalyticsService,
		private imageRenderingService: ImageRenderingService,
		private bottomSheetService: BottomSheetService,
		languageChangeService: LanguageChangeService
	) {
		this.languageChangeService = languageChangeService;

		// Subscribe to language changes
		this.bottomSheetService.languageChanged$.subscribe(() => {
			// Clear current selection immediately
			this.selectedWord = null;
			this.defaultSelectedWordIndex = -1;

			if (this.originalWords.length > 0) {
				this.loadTranslations(this.originalWords);
			}
		});
	}

	ngOnInit() {
		this.analyticsService.logPageView(this.router.url, "Translate");
		this.defaultSelectedWordIndex =
			history.state.selectedWordIndex !== undefined
				? history.state.selectedWordIndex
				: -1;
		const image: Blob | undefined = history.state.image;
		const imageURL: string | undefined = history.state.imageURL;
		const words: string[] | undefined =
			history.state.words || this.config.debugWords;
		let loadingPopUp: MatDialogRef<any> | undefined =
			this.sessionService.currentSession.currentModal;
		if (!loadingPopUp) {
			loadingPopUp = this.dialog.open(LoadingPopUpComponent, {
				closeOnNavigation: false,
				disableClose: true,
				panelClass: "loading-popup",
				data: { showDetailedInfo: false }
			});
			this.sessionService.currentSession.currentModal = loadingPopUp;
			loadingPopUp.beforeClosed().subscribe({
				next: () =>
					(this.sessionService.currentSession.currentModal = null),
			});
		}
		this.initImageTranslations(image, imageURL, words).then(
			() => {
				loadingPopUp?.close();
			},
			(ex) => {
				loadingPopUp?.close();
				if (ex instanceof WordsNotFoundError) {
					this.router.navigateByUrl(AppRoutes.CaptionImage, {
						state: { image },
						replaceUrl: true
					});
				} else {
					loadCapturePageURL().then(
						(url) =>
							this.router.navigateByUrl(url, {
								replaceUrl: true,
							}),
						() =>
							this.router.navigateByUrl(AppRoutes.CaptureImage, {
								replaceUrl: true,
							})
					);
				}
			}
		);
	}

	ngOnDestroy(): void {
		const loadingPopUp: MatDialogRef<any> | undefined =
			this.sessionService.currentSession.currentModal;
		if (loadingPopUp) {
			loadingPopUp.close();
		}
	}

	async initImageTranslations(
		image: Blob | undefined,
		imageURL: string | undefined,
		words: string[] | undefined
	): Promise<void> {
		if (!image) {
			const debugImageUrl = this.config.debugImageUrl;
			if (!debugImageUrl) {
				logger.warn(
					"Image not found in state - returning to previous screen"
				);
				throw new Error("Image not found");
			} else if (words) {
				const debugImage = await this.loadImage(debugImageUrl);
				await this.setImageData(debugImage, debugImageUrl);
				this.originalWords = words;
				await this.loadTranslations(words);
			} else {
				throw new WordsNotFoundError("Words not set");
			}
		} else if (!words) {
			throw new WordsNotFoundError("Words not set");
		} else {
			await this.setImageData(image, imageURL);
			this.originalWords = words;
			await this.loadTranslations(words);
		}
	}

	async loadImage(url: string): Promise<Blob> {
		return await this.http.get(url, { responseType: "blob" }).toPromise();
	}

	async setImageData(
		image: Blob,
		imageURL: string | undefined
	): Promise<void> {
		const valid = await validateImageData(image);
		if (!valid) {
			throw new Error("Invalid image data");
		}
		if (imageURL) {
			const urlValid = await validateImageURL(imageURL);
			if (urlValid) {
				this.setImageURL(imageURL);
			} else {
				URL.revokeObjectURL(imageURL);
				this.setImageURL(URL.createObjectURL(image));
			}
		} else {
			this.setImageURL(URL.createObjectURL(image));
		}
		this.backgroundImageData = image;
		this.renderShareImage();
	}

	setImageURL(url: string) {
		this._persistedHistory = history.state;
		this.backgroundImageURL = url;
		const state = history.state;
		state.imageURL = url;
		history.replaceState(state, "");
	}

	async cleanTranslationResponse(translations: WordTranslation[]): Promise<WordTranslation[]> {
		if (!translations || !Array.isArray(translations)) {
			logger.warn(`Invalid translations array received: ${JSON.stringify(translations)}`);
			return [];
		}

		return translations
			.map((item: WordTranslation) => {
				if (!item) {
					logger.warn("Null or undefined translation item found");
					return null;
				}

				if (!item.translations || !Array.isArray(item.translations)) {
					logger.warn(`Invalid translations array in item: ${JSON.stringify(item)}`);
					return null;
				}

				const validTranslations = item.translations
					.filter((trans: Translation) => {
						if (!trans) return false;
						if (!trans.translation || typeof trans.translation !== 'string') {
							logger.warn(`Invalid translation found: ${JSON.stringify(trans)}`);
							return false;
						}
						return trans.translation.length > 0;
					});

				if (validTranslations.length === 0) {
					logger.warn(`No valid translations found for item: ${JSON.stringify(item)}`);
					return null;
				}

				return {
					...item,
					translations: validTranslations
				};
			})
			.filter((item): item is WordTranslation => item !== null);
	}

	async loadTranslations(words: string[]): Promise<void> {
		let translations: WordTranslation[];
		try {
			this.languageChangeService.setLoading(true);
			// Get translations from the translation service
			let _translations: WordTranslation[] = await this.translationService.translate(
				words,
				this.i18n.currentLanguage.code,
				this.endangeredLanguageService.currentLanguage.code,
				1
			);

			logger.log(`Raw translations received: ${JSON.stringify(_translations)}`);

			// Clean the translations
			translations = await this.cleanTranslationResponse(_translations);
			logger.log(`Cleaned translations: ${JSON.stringify(translations)}`);

			if (!translations || translations.length === 0) {
				logger.warn("No translations remained after cleaning");
				throw new Error("No translations remained after cleaning");
			}

		} catch (ex) {
			logger.warn("Error loading translations:", ex);
			// Set empty translations array instead of fallback translations
			this.zone.run(() => {
				this.translations = [];
				logger.log("Setting empty translations array");
			});
			return;
		} finally {
			this.languageChangeService.setLoading(false);
		}

		// Set the translations and select the first one
		this.zone.run(() => {
			this.translations = translations;
			logger.log(`Setting final translations: ${JSON.stringify(this.translations)}`);
			if (translations.length > 0 && translations[0].translations.length > 0) {
				this.selectedWord = translations[0].translations[0];
				this.defaultSelectedWordIndex = 0;
			}
		});
	}

	onSubmitFeedbackClick() {
		this.axl.sendAxlMessage(AxL.ChildToHost.TRACK, { action: "click share feedback button" });
		this.router.createUrlTree([], {});
		this.router.navigateByUrl(AppRoutes.Feedback, {
			state: { word: this.selectedWord },
			replaceUrl: true
		});
	}

	onViewLanguageClick() {
		this.axl.sendAxlMessage(AxL.ChildToHost.TRACK, { action: "view language" });
		this.bottomSheetService.openViewLanguage();
	}

	onSwitchLanguageClick() {
		const lang = this.endangeredLanguageService.currentLanguage;
		this.axl.sendAxlMessage(AxL.ChildToHost.TRACK, {
			action: "switch language",
			label: lang?.name,
			value: lang?.code
		});
		this.bottomSheetService.openChangeLanguage();
	}

	onBackClick() {
		history.back();
	}

	renderShareImage() {
		if (!this.backgroundImageData || !this.selectedWord) {
			return;
		}

		const language = this.i18n.currentLanguage;

		const endangeredLanguage =
			this.endangeredLanguageService.currentLanguage;

		this.imageRenderingService
			.renderImage(
				this.backgroundImageData,
				this.selectedWord,
				language,
				endangeredLanguage,
				window.innerWidth * window.devicePixelRatio,
				window.innerHeight * window.devicePixelRatio
			)
			.then(
				(img) => {
					this._sharedImage = img;
				},
				(err) => {
					logger.warn("Error rendering image", err);
					this._sharedImage = null;
				}
			);
	}

	onSelectedWordChanged(ev: {
		index: number;
		word: WordTranslation | null;
		translation: string | null;
	}) {
		if (ev.word && ev.translation) {
			this.selectedWord =
				ev.word.translations.find(
					(_trans) => _trans.translation === ev.translation
				) || null;
		}
		const state = history.state;
		state.selectedWordIndex = ev.index;
		history.replaceState(state, "");
		this.renderShareImage();
	}

	onWordShared({
		word,
		translation,
	}: {
		word: WordTranslation;
		translation: string;
	}) {
		const selectedTranslation = word.translations.find(
			(trans) => trans.translation === translation
		);

		if (!selectedTranslation) {
			logger.warn("Translation not found");
			return;
		}

		const language = this.i18n.currentLanguage;
		const endangeredLanguage = this.endangeredLanguageService.currentLanguage;

		this.imageRenderingService
			.renderImage(
				this.backgroundImageData,
				selectedTranslation,
				language,
				endangeredLanguage,
				window.innerWidth * window.devicePixelRatio,
				window.innerHeight * window.devicePixelRatio
			)
			.then(
				(img) => {
					this._sharedImage = img;

					// Original share functionality
					const shareTitle = this.i18n.getTranslation("shareTitle") || undefined;
					const shareText = this.i18n.getTranslation("shareText", {
						original: selectedTranslation.original || selectedTranslation.english,
						translation: selectedTranslation.translation,
						language: endangeredLanguage.name,
					}) || undefined;

					// Send share message through the AxL service
					this.axl.sendAxlMessage(AxL.ChildToHost.SHARE, {
						title: `Do you know ${endangeredLanguage.name}?`,
						text: `Do you know ${endangeredLanguage.name}?`,
						url: window.location.href
					});

					share({
						text: shareText,
						title: shareTitle,
						files: [new File([img], `woolaroo-translation-${selectedTranslation.original}.jpg`, {
							type: img.type,
						})]
					}).then(
						() => {},
						(ex) => {
							logger.warn("Error sharing image", ex);
							if (ex instanceof NotSupportedError) {
								// If sharing is not supported, show download dialog
								this._downloadData = {
									image: img,
									filename: `woolaroo-translation-${selectedTranslation.original || selectedTranslation.english}.jpg`,
								};
								this.dialog.open(DownnloadDialog, {
									data: this._downloadData,
								});
							}
						}
					);
				},
				(err) => {
					logger.warn("Error rendering image", err);
					this._sharedImage = null;
				}
			);
	}

	onManualEntrySelected() {
		this.router.navigateByUrl(AppRoutes.CaptionImage, {
			state: { image: this.backgroundImageData },
			replaceUrl: true
		});
	}

	onAddRecording(word: WordTranslation) {
		this.router.navigateByUrl(AppRoutes.AddWord, { state: { word }, replaceUrl: true });
	}

	onAddTranslation(word: WordTranslation) {
		this.router.navigateByUrl(AppRoutes.AddWord, { state: { word }, replaceUrl: true });
	}

	onOpenMenuClick() {
		this.sidenavOpen = true;
	}

	onSidenavOpenStart() {
		// HACK: Fix iOS Safari iPhone 7+ hiding sidenav on transition complete
		(
			document.getElementsByTagName("mat-sidenav")[0] as HTMLElement
		).style.transform = "none";
	}

	onSidenavClosed() {
		this.sidenavOpen = false;
	}

	checkTranslations() {
		return true;
	}

	navigateToCapture(): void {
		this.router.navigateByUrl(AppRoutes.CaptureImage, { replaceUrl: true });
	}

	getSlot(): string {
		if (this.i18n.currentLanguage?.direction === 'rtl') {
			return 'end';
		}
		return 'start';
	}
}
