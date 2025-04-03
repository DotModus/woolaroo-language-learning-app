import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { MatDialogModule } from "@angular/material/dialog";
import { LoadingPopUpComponent } from "./loading-popup";
import { BusySpinnerModule } from "../../components/busy-spinner/busy-spinner.module";

@NgModule({
	declarations: [LoadingPopUpComponent],
	exports: [LoadingPopUpComponent],
	imports: [
		CommonModule,
		MatDialogModule,
		BusySpinnerModule
	],
	// entryComponents: [LoadingPopUpComponent],
})
export class LoadingPopUpModule {}
