import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app/app.module';
import { environment } from './environments/environment';
import { getLogger, enableLogging } from './util/logging';
import { axlHandshake } from './external/axl'

if (environment.production) {
  enableProdMode();
} else {
  (window as any)._y010 = 1;
}
if (environment.loggingEnabled) {
  enableLogging();
}

const logger = getLogger('EndangeredLanguageService');

axlHandshake()
  .then(() => {
    platformBrowserDynamic().bootstrapModule(AppModule)
      .catch(err => logger.error(err));
  })
  .catch(() => {
    alert("AxL handshake failed");
  })
