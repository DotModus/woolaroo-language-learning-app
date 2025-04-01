import { NgModule } from "@angular/core";
import { RouterModule } from "@angular/router";
import { MatButtonModule } from "@angular/material/button";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatSidenavModule } from "@angular/material/sidenav";
import { FormsModule } from "@angular/forms";
import { ScrollListModule } from "../../components/scroll-list/scroll-list.module";
import { LogoModule } from "../../components/logo/logo.module";
import { PaginationIndicatorModule } from "../../components/pagination-indicator/pagination-indicator.module";
import { IntroAboutPageComponent } from "./about/about";
import { IntroTermsPageComponent } from "./terms/terms";
import { AppToolbarModule } from "../../components/app-toolbar/app-toolbar.module";
import { SidenavModule } from "../../components/sidenav/sidenav.module";
import { I18nModule } from "../../i18n/i18n.module";
import { IconComponentModule } from "../../components/icon/icon.module";
import { CommonModule } from "@angular/common";
import { DirectivesModule } from "../../directives/directives.module";

@NgModule({
	declarations: [IntroAboutPageComponent, IntroTermsPageComponent],
	imports: [
		RouterModule,
		CommonModule,
		MatButtonModule,
		MatSidenavModule,
		MatCheckboxModule,
		FormsModule,
		PaginationIndicatorModule,
		I18nModule,
		ScrollListModule,
		LogoModule,
		AppToolbarModule,
		IconComponentModule,
		SidenavModule,
		DirectivesModule
	],
})
export class IntroPageModule {}
