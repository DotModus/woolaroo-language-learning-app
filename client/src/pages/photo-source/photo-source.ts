import { AfterViewInit, Component, Inject } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { IAnalyticsService, ANALYTICS_SERVICE } from '../../services/analytics';
import { IImageRecognitionService, IMAGE_RECOGNITION_SERVICE } from '../../services/image-recognition';
import { ErrorPopUpComponent } from '../../components/error-popup/error-popup';
import { AppRoutes } from '../../app/routes';
import { SessionService } from '../../services/session';
import { ImageLoaderPageBase } from '../../pages/capture/capture';
import { cameraStreamIsAvailable } from '../../util/camera';
import { IProfileService, PROFILE_SERVICE } from '../../services/profile';
import { I18nService } from '../../i18n/i18n.service';

@Component({
  selector: 'app-page-photo-source',
  templateUrl: './photo-source.html',
  styleUrls: ['./photo-source.scss']
})
export class PhotoSourcePageComponent extends ImageLoaderPageBase implements AfterViewInit {
  private _profileService: IProfileService;
  public get cameraIsAvailable() { return cameraStreamIsAvailable(); }
  public sidenavOpen = false;

  constructor(
    route: ActivatedRoute,
    router: Router,
    i18n: I18nService,
    dialog: MatDialog,
    sessionService: SessionService,
    @Inject(PROFILE_SERVICE) profileService: IProfileService,
    @Inject(IMAGE_RECOGNITION_SERVICE) imageRecognitionService: IImageRecognitionService,
    @Inject(ANALYTICS_SERVICE) private analyticsService: IAnalyticsService) {
    super(route, router, i18n, dialog, sessionService, imageRecognitionService);
    this._profileService = profileService;
  }

  ngAfterViewInit() {
    this.analyticsService.logPageView(this.router.url, 'Photo Source');
  }

  onSidenavClosed() {
    this.sidenavOpen = false;
  }

  onOpenMenuClick() {
    this.sidenavOpen = true;
  }

  onCaptureClick() {
    // Check camera availability first
	  if (!this.cameraIsAvailable) {
      const errorMessage = this.i18n.getTranslation("startCameraError") ||
		  "Camera access denied. To proceed, please enable camera permissions in your browser settings.";

    this.dialog.open(ErrorPopUpComponent, {
        data: { message: errorMessage },
        panelClass: "capture-camera-error",
      });
      return;
	  }

    this._profileService.loadProfile().then(
      profile => {
        if (!profile.language || !profile.endangeredLanguage) {
          // no language chosen - let user change language
          this.router.navigateByUrl(AppRoutes.ChangeLanguage, {replaceUrl: true});
        } else {
          // language chosen - navigate directly to capture image
          this.router.navigateByUrl(AppRoutes.CaptureImage, {replaceUrl: true});
        }
      },
      () => {
        this.router.navigateByUrl(AppRoutes.ChangeLanguage, {replaceUrl: true});
      }
    );
  }
}
