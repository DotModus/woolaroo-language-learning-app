import { NgModule } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatDialogModule } from "@angular/material/dialog";
import { MatSidenavModule } from "@angular/material/sidenav";
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CommonModule } from '@angular/common';
import {
	TranslatePageComponent,
	TRANSLATE_PAGE_CONFIG,
	DownnloadDialog,
} from "./translate";
import { ServicesModule } from "../../services/services.module";
import { IconComponentModule } from "../../components/icon/icon.module";
import { TranslationSelectorModule } from "../../components/translation-selector/translation-selector.module";
import { PipesModule } from "../../pipes/pipes.module";
import { I18nModule } from "../../i18n/i18n.module";
import { environment } from "../../environments/environment";
import { AppToolbarModule } from "../../components/app-toolbar/app-toolbar.module";
import { ImageDisplayModule } from '../../components/image-display/image-display.module';
import { SidenavModule } from "../../components/sidenav/sidenav.module";

@NgModule({
	declarations: [TranslatePageComponent, DownnloadDialog],
	imports: [
		CommonModule,
		MatButtonModule,
		MatSidenavModule,
		IconComponentModule,
		PipesModule,
		TranslationSelectorModule,
		ServicesModule,
		I18nModule,
		AppToolbarModule,
		MatDialogModule,
		ImageDisplayModule,
		SidenavModule,
		MatProgressSpinnerModule,
	],
	providers: [
		{
			provide: TRANSLATE_PAGE_CONFIG,
			useValue: environment.pages.translate,
		},
	],
})
export class TranslatePageModule {}
