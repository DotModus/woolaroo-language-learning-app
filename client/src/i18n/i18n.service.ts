import {
	EventEmitter,
	Inject,
	Injectable,
	InjectionToken,
} from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Direction } from "@angular/cdk/bidi";
import { getLogger } from "../util/logging";
import AxL from "../external/axl";

export interface Language {
	code: string;
	name: string;
	file: string;
	direction: Direction;
	default: boolean;
}

interface I18nServiceConfig {
	languages: Language[];
}

const logger = getLogger("I18nService");

export const I18N_SERVICE_CONFIG = new InjectionToken<I18nServiceConfig>(
	"I18n config"
);

@Injectable()
export class I18nService {
	private _translations: { [key: string]: string } | null;

	private _currentLanguage: Language;
	public get currentLanguage(): Language {
		return this._currentLanguage;
	}

	public readonly currentLanguageChanged: EventEmitter<Language> =
		new EventEmitter();

	public get languages(): Language[] {
		return this.config.languages;
	}

	constructor(
		private http: HttpClient,
		@Inject(I18N_SERVICE_CONFIG) private config: I18nServiceConfig
	) {
		this._translations = null;
		this.checkParams();
		this.initI8n();
	}

	checkParams() {
		const windowparams = new URLSearchParams(window.location.search);
		const docparams = new URLSearchParams(document.location.search);
		const params = windowparams.size > 0 ? windowparams : docparams;
		const paramslang = params.get("locale") || params.get("lang");
		this._currentLanguage = this.config.languages.find((lang) => {
			if (paramslang) {
				localStorage.removeItem('profile');
				return lang.code === paramslang;
			} else {
				return lang.default || this.config.languages[0];
			}
		})
	}

	public async initI8n() {
		this._translations = null;
		this.checkParams();
		await this.loadTranslations(this._currentLanguage);
	}

	async setLanguage(code: string) {
		const language = this.config.languages.find(
			(lang) => lang.code === code
		);
		if (!language) {
			throw new Error("Language not found: " + code);
		}
		this._currentLanguage = language;
		await this.loadTranslations(language);
		const URL_PARAMS = JSON.parse(localStorage.getItem('URL_PARAMS') || '{}');

		const message = { ...URL_PARAMS, lang: language.code, hl: language.code };

		if(language.direction === "rtl") {
			message.rtl = 1;
		}

		console.log("message", message);


		window.axl.sendMessage(AxL.ChildToHost.SET_URL_PARAMS, message);
	}

	async loadTranslations(lang: Language) {
		logger.log(`Loading translations: ${lang.code}`);
		try {
			this._translations = await this.http
				.get<{ [key: string]: string }>(lang.file)
				.toPromise();
		} catch (err) {
			logger.warn("Error loading translation file", err);
			this._translations = {};
		}
		logger.log(`Translations loaded: ${lang.code}`);
		this.currentLanguageChanged.emit(lang);
	}

	getTranslation(
		key: string,
		replacements?: { [index: string]: string }
	): string | null {
		if (!this._translations) {
			return null;
		} else if (!this._translations[key]) {
			return null;
		} else {
			const translation = this._translations[key];
			return translation!.replace(
				/\$\{([^\}]+)\}/g,
				(substring, ...args) => {
					return replacements ? replacements[args[0]] || "" : "";
				}
			);
		}
	}
}
