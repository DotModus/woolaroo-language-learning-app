import { Component, Inject, OnInit, Optional, NgZone } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { getLogger } from '../../util/logging';
import { Router } from '@angular/router';

const logger = getLogger('LoadingPopUpComponent');

interface DialogData {
  capturedImage?: string;
  showDetailedInfo?: boolean;
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
  showDetailedInfo = false;

  constructor(
    private router: Router,
    private ngZone: NgZone,
    @Optional() @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) {
    // Try to set image from data
    if (data && data.capturedImage) {
      this.capturedImage = data.capturedImage;
      this.testImageLoading(this.capturedImage);

      // Show detailed info only when there's a captured image
      this.showDetailedInfo = true;

      console.log('Captured image found - setting showDetailedInfo to true');
    } else {
      // No image, so don't show detailed info
      this.showDetailedInfo = false;
      console.log('No captured image found - setting showDetailedInfo to false');
    }

    // Debug logging
    console.log('LoadingPopUp constructor - data:', data);
    console.log('Router URL:', this.router.url);
    console.log('showDetailedInfo set to:', this.showDetailedInfo);
  }

  ngOnInit() {
    this.isCapturePage = this.router.url.includes('/capture');
    console.log('ngOnInit - isCapturePage:', this.isCapturePage);
    console.log('ngOnInit - showDetailedInfo:', this.showDetailedInfo);
    console.log('ngOnInit - capturedImage:', !!this.capturedImage);

    // Make sure the flag is properly evaluated
    this.ngZone.run(() => {
      // Only show detailed info when there's a captured image
      this.showDetailedInfo = !!this.capturedImage;
      console.log('ngOnInit zone.run - re-evaluated showDetailedInfo:', this.showDetailedInfo);
    });

    // Try again after component is initialized
    if (!this.hasTestedImage && this.data?.capturedImage) {
      this.testImageLoading(this.data.capturedImage);
    }

    // Try once more after a delay
    setTimeout(() => {
      if (this.data?.capturedImage) {
        this.testImageLoading(this.data.capturedImage);
      }
      // Check flag after timeout
      console.log('After timeout - showDetailedInfo:', this.showDetailedInfo);
      console.log('After timeout - capturedImage:', !!this.capturedImage);

      // Make one final check to ensure flag is set correctly
      this.ngZone.run(() => {
        this.showDetailedInfo = !!this.capturedImage;
      });
    }, 500);
  }

  private testImageLoading(imageUrl: string) {
    this.hasTestedImage = true;

    const img = new Image();
    img.onload = () => {
      this.ngZone.run(() => {
        // Image loaded successfully
        console.log('Test image loaded successfully');
      });
    };

    img.onerror = () => {
      this.ngZone.run(() => {
        // Image load error
        console.log('Test image failed to load');
      });
    };

    img.src = imageUrl;
  }
}
