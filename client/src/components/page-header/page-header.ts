import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AppRoutes } from '../../app/routes';

@Component({
  selector: 'app-page-header',
  templateUrl: './page-header.html',
  styleUrls: ['./page-header.scss']
})
export class PageHeaderComponent {

  constructor(
    private readonly router: Router,
    private readonly route: ActivatedRoute
  ) { }

  onCloseClick(ev: MouseEvent) {
    ev.stopPropagation();

    // Always navigate to the capture page regardless of current route
    // This applies to about, technology, languages, and all other pages
    // using the page-header component
    this.router.navigateByUrl(AppRoutes.CaptureImage, {
      replaceUrl: true // Replace current URL to prevent adding to browser history
    });
  }
}
