import { NgModule } from "@angular/core";
import { AboutPageComponent } from "./about";
import { PipesModule } from "../../pipes/pipes.module";
import { I18nModule } from "../../i18n/i18n.module";
import { AppToolbarModule } from "../../components/app-toolbar/app-toolbar.module";
import { IconComponentModule } from "../../components/icon/icon.module";
import { CommonModule } from "@angular/common";

@NgModule({
	declarations: [AboutPageComponent],
	imports: [
		CommonModule,
		PipesModule,
		AppToolbarModule,
		I18nModule,
		IconComponentModule
	],
})
export class AboutPageModule {}
