import { AfterViewInit, Component, Inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IAnalyticsService, ANALYTICS_SERVICE } from '../../services/analytics';

@Component({
  selector: 'app-page-technology',
  templateUrl: './technology.html',
  styleUrls: ['./technology.scss']
})
export class TechnologyPageComponent implements AfterViewInit {
  constructor(private router: Router,
    private route: ActivatedRoute,
    @Inject(ANALYTICS_SERVICE) private analyticsService: IAnalyticsService) {
  }

  ngAfterViewInit() {
    this.analyticsService.logPageView(this.router.url, 'Technology');
  }

  onBackClick(ev: MouseEvent) {
    this.onCloseClick(ev);
  }

  onCloseClick(ev: MouseEvent) {
    ev.stopPropagation();
    this.router.navigate([".."], {relativeTo: this.route})
  }
}
