import { NgModule } from "@angular/core";
import { TERMS_PAGE_CONFIG, TermsPageComponent } from "./terms";
import { IconComponentModule } from "../../components/icon/icon.module";
import { environment } from "../../environments/environment";
import { I18nModule } from "../../i18n/i18n.module";
import { AppToolbarModule } from "../../components/app-toolbar/app-toolbar.module";
import { CommonModule } from "@angular/common";
import { AxlService } from "../../services/axl.service";
import { ANALYTICS_SERVICE } from "../../services/analytics";
import { MockAnalyticsService } from "../../services/mock/analytics";

@NgModule({
	declarations: [TermsPageComponent],
	providers: [
		{
			provide: TERMS_PAGE_CONFIG,
			useValue: environment.pages.termsAndPrivacy,
		},
		AxlService,
		{
			provide: ANALYTICS_SERVICE,
			useClass: MockAnalyticsService
		}
	],
	imports: [
		CommonModule,
		AppToolbarModule,
		IconComponentModule,
		I18nModule
	],
})
export class TermsPageModule {}
