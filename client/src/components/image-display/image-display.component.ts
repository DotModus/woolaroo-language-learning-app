import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-image-display',
  templateUrl: './image-display.component.html',
  styleUrls: ['./image-display.component.scss']
})
export class ImageDisplayComponent {
  @Input() imageUrl: string | null = null;
  @Input() altText: string = 'Displayed image';
}
