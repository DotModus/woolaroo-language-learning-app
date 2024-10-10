import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app/app.module';
import { environment } from './environments/environment';
import { getLogger, enableLogging } from './util/logging';

if (environment.production) {
  enableProdMode();
}
if (environment.loggingEnabled) {
  enableLogging();
}

const logger = getLogger('EndangeredLanguageService');

import { axlHandshake } from './external/axl_integration';

const { handshake } = axlHandshake()
handshake
  .then(() => {
    platformBrowserDynamic().bootstrapModule(AppModule)
      .catch(err => logger.error(err));
  })
  .catch(() => {
    alert("AxL handshake failed");
  })
