import { NgModule } from "@angular/core";
import { TechnologyPageComponent } from "./technology";
import { I18nModule } from "../../i18n/i18n.module";
import { AppToolbarModule } from "../../components/app-toolbar/app-toolbar.module";
import { IconComponentModule } from "../../components/icon/icon.module";
import { CommonModule } from "@angular/common";

@NgModule({
	declarations: [TechnologyPageComponent],
	imports: [
		CommonModule,
		AppToolbarModule,
		I18nModule,
		IconComponentModule
	],
})
export class TechnologyPageModule {}
