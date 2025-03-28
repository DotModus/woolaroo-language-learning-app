import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { AppToolbarComponent } from './app-toolbar';
import { LogoModule } from '../logo/logo.module';

@NgModule({
	declarations: [
		AppToolbarComponent
	],
	imports: [
		CommonModule,
		RouterModule,
		MatToolbarModule,
		LogoModule
	],
	exports: [
		AppToolbarComponent
	]
})
export class AppToolbarModule { }
