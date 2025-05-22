import { AfterViewInit, Component, Inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IAnalyticsService, ANALYTICS_SERVICE } from '../../services/analytics';
import { AppRoutes } from '../../app/routes';

@Component({
  selector: 'app-page-about',
  templateUrl: './about.html',
  styleUrls: ['./about.scss']
})
export class AboutPageComponent implements AfterViewInit {
  constructor(private router: Router,
    private route: ActivatedRoute,
    @Inject(ANALYTICS_SERVICE) private analyticsService: IAnalyticsService) {
  }

  ngAfterViewInit() {
    this.analyticsService.logPageView(this.router.url, 'About');
  }

  onBackClick(ev: MouseEvent) {
    this.onCloseClick(ev);
  }

  onCloseClick(ev: MouseEvent) {
    ev.stopPropagation();
    this.router.navigateByUrl(AppRoutes.CaptureImage, {
      replaceUrl: true
    });
  }
}
