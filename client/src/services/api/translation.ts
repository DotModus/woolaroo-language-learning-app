import { Inject, Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { WordTranslation } from "../entities/translation";
import { ITranslationService, TRANSLATION_CONFIG } from "../translation";

interface APITranslationConfig {
	endpointURL: string;
}

interface TranslationResponse {
	english_word: string;
	primary_word: string;
	translations: [
		{
			english_word: string;
			primary_word: string;
			transliteration: string;
			sound_link: string;
			translation: string;
		}
	];
}

interface TranslateRequest {
	words: string[];
	primaryLanguage: string;
	targetLanguage: string;
}

@Injectable()
export class APITranslationService implements ITranslationService {
	private lastRequest: TranslateRequest | null = null;
	private lastResponse: WordTranslation[] | null = null;

	public constructor(
		private http: HttpClient,
		@Inject(TRANSLATION_CONFIG) private config: APITranslationConfig
	) {}

	private static requestsAreEqual(
		request1: TranslateRequest,
		request2: TranslateRequest
	): boolean {
		if (
			request1.primaryLanguage !== request2.primaryLanguage ||
			request1.targetLanguage !== request2.targetLanguage
		) {
			return false;
		}
		if (request1.words.length !== request2.words.length) {
			return false;
		}
		return request1.words.every((w) => request2.words.indexOf(w) >= 0);
	}

	private static formatSoundURL(url: string | null): string | null {
		if (!url) {
			return url;
		}
		if (url.indexOf("?") >= 0) {
			return `${url}&ngsw-bypass`;
		} else {
			return `${url}?ngsw-bypass`;
		}
	}

	public async translate(
		englishWords: string[],
		primaryLanguage: string,
		targetLanguage: string,
		maxTranslations: number = 0
	): Promise<WordTranslation[]> {
		const lowercaseWords = englishWords.map((w) => w.toLowerCase());
		const storedLanguageCode = localStorage.getItem("currentLanguage");
		const newRequest: TranslateRequest = {
			words: lowercaseWords,
			primaryLanguage,
			targetLanguage,
		};
		if (
			this.lastRequest &&
			this.lastResponse &&
			APITranslationService.requestsAreEqual(this.lastRequest, newRequest)
		) {
			// use cached results
			return Promise.resolve(this.lastResponse);
		}
		const _payload = {
			english_words: lowercaseWords,
			primary_language: primaryLanguage,
			target_language: targetLanguage || storedLanguageCode,
		};

		const response = await this.http
			.post<any>(this.config.endpointURL, _payload)
			.toPromise();

		let translations = response.map((tr: any) => {
			const _transWord = {
				english: tr.english_word,
				primary: tr.translations[0]?.primary_word,
				translations: tr.translations.map((tr: any) => ({
					english: tr.english_word,
					original: tr.primary_word,
					translation: tr.translation,
					transliteration: tr.transliteration,
					soundURL: APITranslationService.formatSoundURL(
						tr.sound_link
					),
				})),
			};

			return _transWord;
		});

		// add any missing translations
		lowercaseWords.forEach((w) => {
			const _tr = translations.find((tr: any) => tr.english === w);
			if (!_tr) {
				translations.push({
					english: w,
					primary: (_tr as any)?.primary,
					translations: [
						{
							original: "",
							translation: "",
							transliteration: "",
							soundURL: "",
							english: "",
						},
					],
				});
			}
		});

		// filter out empty translations
		translations = translations.filter((tr: any) => tr.english);
		// cache results
		this.lastRequest = newRequest;
		this.lastResponse = translations;
		return translations;
	}
}
