import { AfterViewInit, Component, Inject } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { IAnalyticsService, ANALYTICS_SERVICE } from '../../services/analytics';
import { IImageRecognitionService, IMAGE_RECOGNITION_SERVICE } from '../../services/image-recognition';
import { LoadingPopUpComponent } from '../../components/loading-popup/loading-popup';
import { AppRoutes } from '../../app/routes';
import { SessionService } from '../../services/session';
import { addOpenedListener } from '../../util/dialog';
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

  constructor(
    route: ActivatedRoute,
	router: Router,
	location: Location,
    i18n: I18nService,
    dialog: MatDialog,
    sessionService: SessionService,
    @Inject(PROFILE_SERVICE) profileService: IProfileService,
    @Inject(IMAGE_RECOGNITION_SERVICE) imageRecognitionService: IImageRecognitionService,
    @Inject(ANALYTICS_SERVICE) private analyticsService: IAnalyticsService) {
    super(route, router, location, i18n, dialog, sessionService, imageRecognitionService);
    this._profileService = profileService;
  }

  ngAfterViewInit() {
    this.analyticsService.logPageView(this.router.url, 'Photo Source');
  }

  onCaptureClick() {
    this._profileService.loadProfile().then(
      profile => {
        if (!profile.language || !profile.endangeredLanguage) {
          // no language chosen - let user change language
			// this.router.navigateByUrl(AppRoutes.ChangeLanguage);
			this.location.replaceState(AppRoutes.ChangeLanguage)
        } else {
          // language chosen - show loading popup then navigate to capture image
          const loadingPopUp = this.dialog.open(LoadingPopUpComponent,
            { closeOnNavigation: false, disableClose: true, panelClass: 'loading-popup' });
          this.sessionService.currentSession.currentModal = loadingPopUp;
          loadingPopUp.beforeClosed().subscribe({
            complete: () => this.sessionService.currentSession.currentModal = null
          });
			addOpenedListener(
				loadingPopUp,
			// () => this.router.navigateByUrl(AppRoutes.CaptureImage));
				() => this.location.replaceState(AppRoutes.CaptureImage))
        }
      },
      () => {
		//   this.router.navigateByUrl(AppRoutes.ChangeLanguage);
		  this.location.replaceState(AppRoutes.ChangeLanguage)
      }
    );
  }
}
