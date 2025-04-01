import {
	AfterViewInit,
	Component,
	Inject,
	OnDestroy,
	ViewChild,
} from "@angular/core";
import { MatDialog, MatDialogRef } from "@angular/material/dialog";
import { ActivatedRoute, Router } from "@angular/router";
import {
	CameraPreviewComponent,
	CameraPreviewStatus,
} from "../../components/camera-preview/camera-preview";
import { CapturePopUpComponent } from "../../components/capture-popup/capture-popup";
import { ErrorPopUpComponent } from "../../components/error-popup/error-popup";
import { ANALYTICS_SERVICE, IAnalyticsService } from "../../services/analytics";
import {
	IImageRecognitionService,
	IMAGE_RECOGNITION_SERVICE,
} from "../../services/image-recognition";
import { AppRoutes } from "../../app/routes";
import { LoadingPopUpComponent } from "../../components/loading-popup/loading-popup";
import { SessionService } from "../../services/session";
import { addOpenedListener } from "../../util/dialog";
import { I18nService } from "../../i18n/i18n.service";
import { IProfileService, PROFILE_SERVICE } from "../../services/profile";
import { getLogger } from "../../util/logging";
import AxL from "../../external/axl";
import { AxlService } from "../../services/axl.service";
import {
	EndangeredLanguage,
	EndangeredLanguageService,
} from "../../services/endangered-language";

const logger = getLogger("CapturePageComponent");

export class ImageLoaderPageBase {
	constructor(
		private route: ActivatedRoute,
		protected router: Router,
		protected i18n: I18nService,
		protected dialog: MatDialog,
		protected sessionService: SessionService,
		@Inject(IMAGE_RECOGNITION_SERVICE)
		protected imageRecognitionService: IImageRecognitionService
	) {}

	onImageUploaded(image: Blob) {
		const loadingPopUp = this.dialog.open(LoadingPopUpComponent, {
			closeOnNavigation: false,
			disableClose: true,
			panelClass: "loading-popup",
		});
		this.sessionService.currentSession.currentModal = loadingPopUp;
		loadingPopUp.beforeClosed().subscribe({
			complete: () =>
				(this.sessionService.currentSession.currentModal = null),
		});
		addOpenedListener(loadingPopUp, () =>
			this.loadImageDescriptions(image, loadingPopUp)
		);
	}

	protected loadImageDescriptions(
		image: Blob,
		loadingPopUp: MatDialogRef<any>,
		existingImageUrl?: string
	) {
		// Use the image URL that was already created in onCaptureClick if available
		const imageUrl = existingImageUrl || URL.createObjectURL(image);

		this.imageRecognitionService.loadDescriptions(image).then(
			(descriptions) => {
				if (descriptions.length > 0) {
					const targetLanguage = this.route.snapshot.queryParams.target_lang;

					let url = targetLanguage ? `${AppRoutes.Translate}?target_lang=${targetLanguage}` : AppRoutes.Translate;

					this.router
						.navigateByUrl(url, {
							state: {
								image,
								imageURL: imageUrl,
								words: descriptions.map((d) => d.description),
							},
							replaceUrl: true
						})
						.then(
							(success) => {
								if (!success) {
									loadingPopUp.close();
								}
							},
							() => loadingPopUp.close()
						);

				} else {
					this.router
						.navigateByUrl(AppRoutes.CaptionImage, {
							state: {
								image,
								imageURL: imageUrl,
							},
							replaceUrl: true
						})
						.finally(() => loadingPopUp.close());
				}
			},
			(err) => {
				loadingPopUp.close();
				const errorTitle =
					this.i18n.getTranslation("imageRecognitionErrorTitle") ||
					"Unable to connect";
				const errorMessage =
					this.i18n.getTranslation("imageRecognitionErrorMessage") ||
					"Please check network connection";
				this.dialog.open(ErrorPopUpComponent, {
					data: { message: errorMessage, title: errorTitle },
				});
				this.router.navigateByUrl(AppRoutes.CaptionImage, {
					state: { image, imageURL: imageUrl },
					replaceUrl: true
				});
			}
		);
	}
}

@Component({
	selector: "app-page-capture",
	templateUrl: "capture.html",
	styleUrls: ["./capture.scss"],
})
export class CapturePageComponent
	extends ImageLoaderPageBase
	implements AfterViewInit, OnDestroy
{
	@ViewChild(CameraPreviewComponent)
	private cameraPreview: CameraPreviewComponent | null = null;
	private modalIsForCameraStartup = true;
	public captureInProgress = false;
	public sidenavOpen = false;

	constructor(
		route: ActivatedRoute,
		router: Router,
		dialog: MatDialog,
		sessionService: SessionService,
		i18n: I18nService,
		private axl: AxlService,
		@Inject(PROFILE_SERVICE) private profileService: IProfileService,
		@Inject(IMAGE_RECOGNITION_SERVICE)
		imageRecognitionService: IImageRecognitionService,
		@Inject(ANALYTICS_SERVICE) private analyticsService: IAnalyticsService,
		private endangeredLanguageService: EndangeredLanguageService
	) {
		super(route, router, i18n, dialog, sessionService, imageRecognitionService);
	}

	ngAfterViewInit() {
		// Initialize loading popup
		let loadingPopUp: MatDialogRef<any>;

		// Create loading popup while camera initializes
		loadingPopUp = this.dialog.open(LoadingPopUpComponent, {
			disableClose: true,
			panelClass: ["loading-popup", "custom-dialog", "fullscreen-dialog"],
			maxWidth: '100vw',
			width: '100%',
			height: '100%',
			backdropClass: 'dark-backdrop',
			position: { top: '0', left: '0', right: '0', bottom: '0' }
		});

		// Store reference in session for cleanup if needed
		this.sessionService.currentSession.currentModal = loadingPopUp;

		this.analyticsService.logPageView(this.router.url, "Capture");
		if (!this.cameraPreview) {
			// Close the loading popup since camera failed
			if (loadingPopUp) {
				loadingPopUp.close();
			}
			this.router.navigateByUrl(AppRoutes.ImageSource, {
				replaceUrl: true,
			});
			return;
		}

		loadingPopUp.afterClosed().subscribe({
			next: () => (this.modalIsForCameraStartup = false),
		});

		this.cameraPreview.start().then(
			() => {
				// Close the loading popup once camera is ready
				if (loadingPopUp) {
					loadingPopUp.close();
				}
			},
			(err) => {
				// Close the loading popup since camera failed
				if (loadingPopUp) {
					loadingPopUp.close();
				}
				const errorMessage =
					this.i18n.getTranslation("startCameraError") ||
					"Camera access denied. To proceed, please enable camera permissions in your browser settings.";
				const errorDialog = this.dialog.open(ErrorPopUpComponent, {
					data: { message: errorMessage },
					panelClass: "capture-camera-error",
				});
				errorDialog.afterClosed().subscribe({
					complete: () => this.router.navigateByUrl(AppRoutes.ImageSource, {
							replaceUrl: true,
						}),
				});
			}
		);
	}

	ngOnDestroy(): void {
		const loadingPopUp: MatDialogRef<any> | undefined =
			this.sessionService.currentSession.currentModal;
		if (loadingPopUp && this.modalIsForCameraStartup) {
			loadingPopUp.close();
		}
	}

	onCaptureClick() {
		const lang = this.endangeredLanguageService.currentLanguage;

		this.axl.sendAxlMessage(AxL.ChildToHost.TRACK, { action: `take picture`, label: lang?.name, value: lang?.code });

		if (!this.cameraPreview) {
			return;
		} else if (this.cameraPreview.status !== CameraPreviewStatus.Started) {
			return;
		}
		const preview = this.cameraPreview;
		this.captureInProgress = true;

		// First capture the image
		preview.capture().then(
			(image) => {
				// Create image URL
				const imageUrl = URL.createObjectURL(image);

				// Test loading the image before opening dialog
				const testImg = new Image();
				testImg.onload = () => {
					// Create dialog data with verified image URL
					const dialogData = { capturedImage: imageUrl };

					// Show loading popup with the captured image
					const loadingPopUp = this.dialog.open(LoadingPopUpComponent, {
						closeOnNavigation: false,
						disableClose: true,
						panelClass: ["loading-popup", "custom-dialog", "fullscreen-dialog"],
						maxWidth: '100vw',
						width: '100%',
						height: '100%',
						backdropClass: 'dark-backdrop',
						position: { top: '0', left: '0', right: '0', bottom: '0' },
						data: dialogData
					});

					// DIRECT DOM APPROACH: Manually inject the image into the specific container
					setTimeout(() => {
						try {
							// Find the image container
							const imageContainer = document.getElementById('imageContainerForDirectInjection');
							if (imageContainer) {
								// Clear the container
								imageContainer.innerHTML = '';

								// Determine if we're on desktop or mobile
								const isDesktop = window.innerWidth >= 768;

								// Create a direct image element
								const img = document.createElement('img');
								img.src = imageUrl;
								img.alt = 'Captured Image';
								img.style.width = '100%';
								img.style.height = '100%';
								img.style.objectFit = 'cover';
								img.style.display = 'block';
								img.style.margin = '0 auto';
								img.style.borderRadius = '16px';

								// Set up onload handler to make container visible when image loads
								img.onload = () => {
									// Make the container visible once image is loaded
									imageContainer.style.display = 'flex';
								};

								img.onerror = () => {
									// Keep container hidden if image fails to load
									imageContainer.style.display = 'none';
								};

								// Add the image to the container
								imageContainer.appendChild(img);
							}
						} catch (err) {
							// Error handling
						}
					}, 300); // Wait for the dialog to fully render

					this.sessionService.currentSession.currentModal = loadingPopUp;
					loadingPopUp.beforeClosed().subscribe({
						complete: () => (this.sessionService.currentSession.currentModal = null),
					});

					// Process the image
					this.loadImageDescriptions(image, loadingPopUp, imageUrl);
				};

				testImg.onerror = () => {
					// Still open dialog but without image
					const loadingPopUp = this.dialog.open(LoadingPopUpComponent, {
						closeOnNavigation: false,
						disableClose: true,
						panelClass: ["loading-popup", "custom-dialog", "fullscreen-dialog"],
						maxWidth: '100vw',
						width: '100%',
						height: '100%',
						backdropClass: 'dark-backdrop',
						position: { top: '0', left: '0', right: '0', bottom: '0' }
					});

					this.sessionService.currentSession.currentModal = loadingPopUp;
					loadingPopUp.beforeClosed().subscribe({
						complete: () => (this.sessionService.currentSession.currentModal = null),
					});

					// Process the image
					this.loadImageDescriptions(image, loadingPopUp);
				};

				// Start loading test
				testImg.src = imageUrl;
			},
			(err) => {
				this.captureInProgress = false;
				const errorMessage =
					this.i18n.getTranslation("captureImageError") ||
					"Unable to capture image";
				this.dialog.open(ErrorPopUpComponent, {
					data: { message: errorMessage },
				});
			}
		);
	}

	onSidenavOpenStart() {
		// HACK: Fix iOS Safari iPhone 7+ hiding sidenav on transition complete
		(
			document.getElementsByTagName("mat-sidenav")[0] as HTMLElement
		).style.transform = "none";
	}

	onOpenMenuClick() {
		this.sidenavOpen = true;
	}

	onSidenavClosed() {
		this.sidenavOpen = false;
	}

	onChangeLanguageClick() {
		this.router.navigateByUrl(AppRoutes.ChangeLanguage, {replaceUrl: true});

	}
}
