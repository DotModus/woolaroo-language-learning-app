import { AfterViewInit, Component, HostBinding, Inject } from "@angular/core";
import { Router } from "@angular/router";
import { AppRoutes } from "../../../app/routes";
import {
	IAnalyticsService,
	ANALYTICS_SERVICE,
} from "../../../services/analytics";
import { environment } from "../../../environments/environment";
import { IProfileService, PROFILE_SERVICE } from "../../../services/profile";
import { Profile } from "../../../services/entities/profile";
import {
	getOperatingSystem,
	isMobileDevice,
	OperatingSystem,
} from "../../../util/platform";
import { cameraStreamIsAvailable } from "../../../util/camera";
import { AxlService } from "../../../services/axl.service";
import AxL from '../../../external/axl';

@Component({
	selector: "app-page-intro-about",
	templateUrl: "./about.html",
	styleUrls: ["./about.scss"],
})
export class IntroAboutPageComponent implements AfterViewInit {
	public get deviceSupported(): boolean {
		return isMobileDevice();
	}
	public get isOldIOSVersion(): boolean {
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
		@Inject(PROFILE_SERVICE) private profileService: IProfileService
	) {
		console.log(navigator.language);
	}

	onBackClick() {
		history.back();
	}

	ngAfterViewInit() {
		this.analyticsService.logPageView(this.router.url, "Intro - About");
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
		// if (
		// 	(!profile || !profile.termsAgreed) &&
		// 	environment.pages.termsAndPrivacy.enabled
		// ) {
		// 	this.router.navigateByUrl(AppRoutes.IntroTermsAndConditions, {replaceUrl: true});
		// } else {
			this.router.navigateByUrl(AppRoutes.CaptureImage, {replaceUrl: true});
		// }
	}
}
