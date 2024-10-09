import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app/app.module';
import { environment } from './environments/environment';
import { getLogger, enableLogging } from './util/logging';

if (environment.production) {
  enableProdMode();
} else {
  console.log("It should be in dev mode");
  (window as any)._y010 = 1;
}
if (environment.loggingEnabled) {
  enableLogging();
}

const logger = getLogger('EndangeredLanguageService');

import { axlHandshake } from './external/axl_integration';

axlHandshake()
  .then(() => {
    platformBrowserDynamic().bootstrapModule(AppModule)
      .catch(err => logger.error(err));
  })
  .catch(() => {
    alert("AxL handshake failed");
  })
