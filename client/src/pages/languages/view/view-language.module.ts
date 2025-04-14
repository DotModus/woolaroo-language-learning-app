import { NgModule } from "@angular/core";
import { RouterModule } from "@angular/router";
import { CommonModule } from "@angular/common";
import { I18nModule } from "../../../i18n/i18n.module";
import { ViewLanguagePageComponent } from "./view-language";
import { ScrollListModule } from "../../../components/scroll-list/scroll-list.module";
import { IconComponentModule } from "../../../components/icon/icon.module";
import { AppToolbarModule } from "../../../components/app-toolbar/app-toolbar.module";
import { MatBottomSheetModule, MAT_BOTTOM_SHEET_DATA } from "@angular/material/bottom-sheet";

@NgModule({
	declarations: [ViewLanguagePageComponent],
	exports: [ViewLanguagePageComponent],
	imports: [
		RouterModule,
		CommonModule,
		I18nModule,
		ScrollListModule,
		IconComponentModule,
		AppToolbarModule,
		MatBottomSheetModule
	],
	providers: [
		{ provide: MAT_BOTTOM_SHEET_DATA, useValue: {} }
	]
})
export class ViewLanguageModule {}
