import { Component, Inject, OnInit, Optional, NgZone } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { getLogger } from '../../util/logging';
import { Router } from '@angular/router';

const logger = getLogger('LoadingPopUpComponent');

interface DialogData {
  capturedImage?: string;
}

@Component({
  selector: 'app-loading-popup',
  templateUrl: './loading-popup.html',
  styleUrls: ['./loading-popup.scss']
})
export class LoadingPopUpComponent implements OnInit {
  capturedImage: string | null = null;
  isCapturePage = false;
  hasTestedImage = false;

  constructor(
    private router: Router,
    private ngZone: NgZone,
    @Optional() @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) {
    // Try to set image from data
    if (data && data.capturedImage) {
      this.capturedImage = data.capturedImage;
      this.testImageLoading(this.capturedImage);
    }
  }

  ngOnInit() {
    this.isCapturePage = this.router.url.includes('/capture');

    // Try again after component is initialized
    if (!this.hasTestedImage && this.data?.capturedImage) {
      this.testImageLoading(this.data.capturedImage);
    }

    // Try once more after a delay
    setTimeout(() => {
      if (this.data?.capturedImage) {
        this.testImageLoading(this.data.capturedImage);
      }
    }, 500);
  }

  private testImageLoading(imageUrl: string) {
    this.hasTestedImage = true;

    const img = new Image();
    img.onload = () => {
      this.ngZone.run(() => {
        // Image loaded successfully
      });
    };

    img.onerror = () => {
      this.ngZone.run(() => {
        // Image load error
      });
    };

    img.src = imageUrl;
  }
}
