import { Component, EventEmitter, Output } from "@angular/core";
import { Router } from "@angular/router";
import { SessionService } from "../../services/session";
import { environment } from "../../environments/environment";
import { I18nService, Language } from "../../i18n/i18n.service";

@Component({
	selector: "app-sidenav",
	templateUrl: "./sidenav.html",
	styleUrls: ["./sidenav.scss"],
})
export class SidenavComponent {
	// Add output event to emit when menu should close
	@Output() menuClosed = new EventEmitter<void>();

	get addToHomeScreenEnabled(): boolean {
		return !!this.sessionService.currentSession.installPrompt;
	}
	get termsAndPrivacyEnabled(): boolean {
		return environment.pages.termsAndPrivacy.enabled;
	}

	// Property to track current language
	get currentLanguage(): Language {
		return this.i18nService.currentLanguage;
	}

	constructor(
		private sessionService: SessionService,
		private i18nService: I18nService,
		private router: Router
	) {}

	onAddToHomeScreenClick() {
		this.sessionService.currentSession.installPrompt.prompt();
		this.sessionService.currentSession.installPrompt.userChoice.then(() => {
			this.sessionService.currentSession.installPrompt = null;
		});
	}

	// Method to handle closing the sidenav menu
	onCloseMenu(): void {
		this.menuClosed.emit();
	}

	// Method to handle language changes
	onLanguageChange(languageCode: string) {
		if (languageCode && languageCode !== this.currentLanguage.code) {
			this.i18nService.setLanguage(languageCode);
		}
	}

	// Navigation methods with replaceUrl option
	navigateTo(route: string, state?: any): void {
		this.router.navigateByUrl(route, {
			replaceUrl: true,
			state: state
		});
	}
}
