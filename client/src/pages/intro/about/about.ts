import { AfterViewInit, Component, Inject } from "@angular/core";
import { Router } from "@angular/router";
import { MatDialog, MatDialogRef } from "@angular/material/dialog";
import { AppRoutes } from "../../../app/routes";
import { AxlService } from "../../../services/axl.service";
import { ANALYTICS_SERVICE, IAnalyticsService } from "../../../services/analytics";
import { IProfileService, PROFILE_SERVICE } from "../../../services/profile";
import { Profile } from "../../../services/entities/profile";
import {
	getOperatingSystem,
	OperatingSystem,
	isMobileDevice
} from "../../../util/platform";
import { cameraStreamIsAvailable } from "../../../util/camera";
import { LoadingPopUpComponent } from "../../../components/loading-popup/loading-popup";
import { ErrorPopUpComponent } from "../../../components/error-popup/error-popup";
import { I18nService } from "../../../i18n/i18n.service";
import { IImageRecognitionService, IMAGE_RECOGNITION_SERVICE } from "../../../services/image-recognition";
import { SessionService } from "../../../services/session";
import AxL from "../../../external/axl";
import { addOpenedListener } from "../../../util/dialog";

@Component({
	selector: "app-page-intro-about",
	templateUrl: "about.html",
	styleUrls: ["./about.scss"],
})
export class IntroAboutPageComponent implements AfterViewInit {
	get iOS(): boolean {
		return (
			getOperatingSystem() === OperatingSystem.iOS &&
			!cameraStreamIsAvailable()
		);
	}

	tAndC: boolean = false;

	public sidenavOpen = false;

	constructor(
		private router: Router,
		private axl: AxlService,
		@Inject(ANALYTICS_SERVICE) private analyticsService: IAnalyticsService,
		@Inject(PROFILE_SERVICE) private profileService: IProfileService,
		private dialog: MatDialog,
		private i18n: I18nService,
		@Inject(IMAGE_RECOGNITION_SERVICE) private imageRecognitionService: IImageRecognitionService,
		private sessionService: SessionService
	) {
		console.log(navigator.language);
	}

	onBackClick() {
		history.back();
	}

	ngAfterViewInit() {
		this.analyticsService.logPageView(this.router.url, "Intro - About");
	}

	onImageUploaded(image: Blob) {
		// Only process when terms are accepted
		if (!this.tAndC) {
			return;
		}

		const loadingPopUp = this.dialog.open(LoadingPopUpComponent, {
			closeOnNavigation: false,
			disableClose: true,
			panelClass: "loading-popup",
		});

		// Track the modal in the session service
		this.sessionService.currentSession.currentModal = loadingPopUp;
		loadingPopUp.beforeClosed().subscribe({
			complete: () => (this.sessionService.currentSession.currentModal = null),
		});

		// Log the action
		this.axl.sendAxlMessage(AxL.ChildToHost.TRACK, { action: "upload picture" });

		// Process image using the opened listener
		addOpenedListener(loadingPopUp, () => this.processUploadedImage(image, loadingPopUp));
	}

	private processUploadedImage(image: Blob, loadingPopUp: MatDialogRef<any>) {
		const imageUrl = URL.createObjectURL(image);

		this.imageRecognitionService.loadDescriptions(image).then(
			(descriptions) => {
				if (descriptions.length > 0) {
					const targetLanguage = null; // We don't have a route snapshot to check for target_lang

					let url = AppRoutes.Translate;

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

	onNextClick() {
		this.axl.sendAxlMessage(AxL.ChildToHost.TRACK, { action: "get started" });
		this.profileService.loadProfile().then(
			(profile) => this.nextPage(profile),
			() => this.nextPage()
		);
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

	onViewTermsClick() {
		this.router.navigateByUrl(AppRoutes.TermsAndConditions, {replaceUrl: true});
	}

	nextPage(profile: Profile | null = null) {
		this.router.navigateByUrl(AppRoutes.CaptureImage, {replaceUrl: true});
	}
}
