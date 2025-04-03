import { NgModule } from "@angular/core";
import { TERMS_PAGE_CONFIG, TermsPageComponent } from "./terms";
import { IconComponentModule } from "../../components/icon/icon.module";
import { environment } from "../../environments/environment";
import { I18nModule } from "../../i18n/i18n.module";
import { AppToolbarModule } from "../../components/app-toolbar/app-toolbar.module";
import { CommonModule } from "@angular/common";

@NgModule({
	declarations: [TermsPageComponent],
	providers: [
		{
			provide: TERMS_PAGE_CONFIG,
			useValue: environment.pages.termsAndPrivacy,
		},
	],
	imports: [
		CommonModule,
		AppToolbarModule,
		IconComponentModule,
		I18nModule
	],
})
export class TermsPageModule {}
