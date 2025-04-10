import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-toolbar',
  templateUrl: './app-toolbar.html',
  styleUrls: ['./app-toolbar.scss']
})
export class AppToolbarComponent implements OnInit {
  showLogo: boolean = true;

  constructor(private router: Router) {}

  ngOnInit() {
    // Set initial state based on current path
    this.updateLogoVisibility(this.router.url);

    // Listen for route changes
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd)
    ).subscribe((event) => {
      this.updateLogoVisibility(event.url);
    });
  }

  private updateLogoVisibility(url: string) {
    // Hide logo on /intro/about route, show on all other routes
    this.showLogo = !url.includes('/intro/about');
  }
}
