import { Component, Input, SecurityContext } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { IconConfig, IconName } from './icon-config';

@Component({
  selector: 'app-icon',
  template: '<span class="icon" [innerHTML]="sanitizedIcon"></span>',
  styles: [`
    .icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
    .icon ::ng-deep svg {
      width: 1em;
      height: 1em;
    }
  `]
})
export class IconComponent {
  @Input() set name(value: IconName) {
    this._name = value;
    this.updateIcon();
  }

  private _name: IconName = 'pencil';
  sanitizedIcon: SafeHtml;

  constructor(private sanitizer: DomSanitizer) {
    this.sanitizedIcon = this.sanitizer.bypassSecurityTrustHtml(IconConfig[this._name]);
  }

  private updateIcon() {
    const svgContent = IconConfig[this._name];
    this.sanitizedIcon = this.sanitizer.bypassSecurityTrustHtml(svgContent);
  }
}
