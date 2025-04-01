import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import { AppRoutes } from '../../app/routes';

@Component({
  selector: 'app-image-display',
  templateUrl: './image-display.component.html',
  styleUrls: ['./image-display.component.scss']
})
export class ImageDisplayComponent {
  @Input() imageUrl: string | null = null;
  @Input() altText: string = 'Displayed image';

  constructor(private router: Router) {}

  navigateToCapture(): void {
    this.router.navigateByUrl(AppRoutes.CaptureImage, { replaceUrl: true });
  }
}
