import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ImageDisplayComponent } from './image-display.component';

@NgModule({
  declarations: [
    ImageDisplayComponent
  ],
  imports: [
    CommonModule
  ],
  exports: [
    ImageDisplayComponent
  ]
})
export class ImageDisplayModule { }