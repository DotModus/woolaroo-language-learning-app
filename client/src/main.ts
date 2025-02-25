import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app/app.module';
import { environment } from './environments/environment';
import { enableLogging, getLogger } from './util/logging';
import { axlHandshake } from './external/axl_integration';

declare global {
  interface Window {
    axl: any;
  }
}

if (environment.production) {
  enableProdMode();
}
if (environment.loggingEnabled) {
  enableLogging();
}

const logger = getLogger('EndangeredLanguageService');

export const setLangParams = (params: any) => {
  const profile: any = JSON.parse(window.localStorage.getItem('profile') || '{}');
  let currentLanguage = window.localStorage.getItem('currentLanguage');
  if (profile) {
    profile.endangeredLanguage = params?.target_lang;
    profile.language = params?.lang;
    window.localStorage.setItem('profile', JSON.stringify(profile));
  }
  if (currentLanguage) {
    currentLanguage = params?.target_lang;
    window.localStorage.setItem('currentLanguage', currentLanguage);
  }
  window.localStorage.setItem('URL_PARAMS', JSON.stringify(params));

}

platformBrowserDynamic().bootstrapModule(AppModule).then(() => {
  const { handshake, axl } = axlHandshake()
  window.axl = axl;
  handshake
    .then((params: any) => {
      if (axl?.type === 'AXL_MESSAGE') {
        if (Object.keys(axl.payload).length > 0) {
          if (axl.payload.hasOwnProperty('target_lang') || axl.payload.hasOwnProperty('lang')) {
            setLangParams(axl?.payload);
          }
        }
      }
        if (params.hasOwnProperty('target_lang') || params.hasOwnProperty('lang')) {
          setLangParams(params);
        }
    })
    .catch(() => {
      alert("AxL handshake failed");
    })
})
.catch(err => logger.error(err));


