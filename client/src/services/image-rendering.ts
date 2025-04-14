import { Inject, Injectable, InjectionToken } from "@angular/core";
import { Translation } from "./entities/translation";
import { canvasToBlob } from "../util/image";
import { I18nService, Language } from "../i18n/i18n.service";
import { EndangeredLanguage } from "./endangered-language";

interface ImageRenderingConfig {
	dropShadowDistance: number;
	dropShadowColor: string;
	foregroundColor: string;
	languages: ImageRenderingTextConfig;
	transliteration: ImageRenderingTextConfig;
	translation: ImageRenderingTextConfig;
	originalWord: ImageRenderingTextConfig;
	line: { width: number; height: number; marginBottom: number };
	banner: {
		backgroundColor: string;
		height: number;
		logoY: number;
		logoHeight: number;
		logoURL: string;
		attributionHeight: number;
		attributionURL: string;
		tagURL: string;
		spacing: number;
	};
	padding: number;
}

interface ImageRenderingTextConfig {
	font: string;
	lineHeight: number;
	lineSpacing: number;
	marginBottom: number;
}

export const IMAGE_RENDERING_CONFIG = new InjectionToken<ImageRenderingConfig>(
	"Image rendering config"
);

@Injectable()
export class ImageRenderingService {
	private static _getTextLines(
		context: CanvasRenderingContext2D,
		text: string,
		maxWidth: number
	): string[] {
		const lines: string[] = [];
		let remainingText = text;
		while (remainingText) {
			const metrics = context.measureText(remainingText);
			if (metrics.width < maxWidth) {
				lines.push(remainingText);
				break;
			}
			let breakIndex = Math.floor(
				(remainingText.length * maxWidth) / metrics.width
			);
			if (breakIndex <= 0) {
				lines.push(remainingText);
				break;
			}
			const prevWhitespaceIndex = remainingText.lastIndexOf(
				" ",
				breakIndex
			);
			if (prevWhitespaceIndex >= 0) {
				breakIndex = prevWhitespaceIndex;
			}
			lines.push(remainingText.slice(0, breakIndex));
			remainingText = remainingText.slice(breakIndex).trim();
		}
		return lines;
	}

	private static async _loadImage(url: string): Promise<HTMLImageElement> {
		return new Promise((resolve, reject) => {
			const image: HTMLImageElement = document.createElement("img");
			image.onload = () => resolve(image);
			image.onerror = reject;
			image.src = url;
		});
	}

	constructor(
		@Inject(IMAGE_RENDERING_CONFIG) private config: ImageRenderingConfig,
		private i18n: I18nService
	) {}

	async renderImage(
		imageData: Blob,
		word: Translation,
		sourceLanguage: Language,
		endangeredLanguage: EndangeredLanguage,
		width: number,
		height: number
	): Promise<Blob> {
		const imageURL = URL.createObjectURL(imageData);
		let image: HTMLImageElement;
		try {
			image = await ImageRenderingService._loadImage(imageURL);
		} catch (ex) {
			console.error('Failed to load source image:', ex);
			URL.revokeObjectURL(imageURL);
			throw ex;
		}

		const canvas: HTMLCanvasElement = document.createElement("canvas");
		canvas.width = width;
		canvas.height = height;
		const imageWidth = image.naturalWidth;
		const imageHeight = image.naturalHeight;
		const context = canvas.getContext("2d");
		if (!context) {
			console.error('Unable to create canvas context');
			throw new Error("Unable to create canvas context");
		}

		// multiplier to scale canvas down to contain image dimensions
		const imageScale = Math.min(imageWidth / width, imageHeight / height);
		const croppedImageWidth = Math.round(width * imageScale);
		const croppedImageHeight = Math.round(height * imageScale);
		const croppedImageDx = (imageWidth - croppedImageWidth) * 0.5;
		const croppedImageDy = (imageHeight - croppedImageHeight) * 0.5;

		context.drawImage(
			image,
			croppedImageDx,
			croppedImageDy,
			croppedImageWidth,
			croppedImageHeight,
			0,
			0,
			width,
			height
		);

		// Add semi-transparent black overlay with 0.5 opacity
		context.fillStyle = 'rgba(0, 0, 0, 0.5)'; // Black with 0.5 opacity
		context.fillRect(0, 0, width, height);

		// Calculate scale for rendering
		const scale = Math.min(
			width / window.innerWidth,
			height / window.innerHeight
		);

		// Define text area dimensions (60% width, centered)
		const textAreaWidth = width * 0.6; // 60% of the screen width
		const textAreaLeft = (width - textAreaWidth) / 2; // Center horizontally

		// Add full-width area at the bottom with height of 420px
		const bottomAreaHeight = 420;
		const bottomAreaY = height - bottomAreaHeight;

		// Set the background color to #F0F2E7
		context.fillStyle = '#F0F2E7';
		context.fillRect(0, bottomAreaY, width, bottomAreaHeight);

		// Add a subtle divider line at the top of the bottom area
		context.strokeStyle = 'rgba(0, 0, 0, 0.2)';
		context.lineWidth = 1;
		context.beginPath();
		context.moveTo(0, bottomAreaY);
		context.lineTo(width, bottomAreaY);
		context.stroke();

		if (!word) {
			return canvasToBlob(canvas);
		}

		context.setTransform(scale, 0, 0, scale, 0, 0);

		// Render translations first (from top)
		this._renderTranslations(
			context,
			word,
			sourceLanguage,
			endangeredLanguage,
			width,
			height - bottomAreaHeight,
			scale
		);

		// Render logo and attribution in the bottom area
		await this._renderBottomAreaContent(context, width, scale, bottomAreaY, bottomAreaHeight);

		// Convert canvas to blob
		const resultBlob = await canvasToBlob(canvas);

		return resultBlob;
	}

	private _renderTranslations(
		context: CanvasRenderingContext2D,
		word: Translation,
		sourceLanguage: Language,
		endangeredLanguage: EndangeredLanguage,
		width: number,
		height: number,
		scale: number
	) {
		const centerX = (width * 0.5) / scale;
		// Start at top with padding instead of bottom
		let y = this.config.padding / scale;

		// Limit text to 60% of the screen width, leaving 20% on each side
		const textAreaWidth = width * 0.6; // 60% of total width
		const maxTextWidth = (textAreaWidth - 2 * this.config.padding) / scale;

		// The correct order of elements from top to bottom is:
		// 1. Translation (if available and different from transliteration)
		// 2. Transliteration (if available)
		// 3. "It's the [language] word for" statement
		// 4. Original word (English)
		// 5. Language description (if available)

		// Collection of elements to render in order - from top to bottom
		const elements = [];

		// 1. Translation element if available and different from transliteration
		if (word.translation && word.translation !== word.transliteration) {
			elements.push({
				text: word.translation.charAt(0).toUpperCase() + word.translation.slice(1),
				config: this.config.translation
			});
		}

		// 2. Transliteration element if available
		if (word.transliteration) {
			elements.push({
				text: word.transliteration,
				config: this.config.transliteration
			});
		}

		// 3. "It's the [language] word for" statement
		const introText = `It's the ${endangeredLanguage.name} word for`;
		elements.push({
			text: introText,
			config: this.config.languages
		});

		// 4. Original word (English)
		const originalWord = word.original || word.english;
		elements.push({
			text: originalWord.charAt(0).toUpperCase() + originalWord.slice(1),
			config: this.config.originalWord
		});

		// 5. Language description if available
		if (endangeredLanguage.shortDescriptions && endangeredLanguage.shortDescriptions['en']) {
			elements.push({
				text: endangeredLanguage.shortDescriptions['en'],
				config: this.config.languages
			});
		}

		// Render all elements in the order they are in the array (top to bottom)
		for (const element of elements) {
			y = this._renderTextFromTop(
				context,
				element.text,
				element.config,
				centerX,
				y,
				maxTextWidth
			);
		}
	}

	private _renderTextFromTop(
		context: CanvasRenderingContext2D,
		text: string,
		config: ImageRenderingTextConfig,
		centerX: number,
		topY: number,
		maxWidth: number
	): number {
		context.font = config.font;
		let y = topY + config.marginBottom;
		const lines = ImageRenderingService._getTextLines(
			context,
			text,
			maxWidth
		);

		for (let k = 0; k < lines.length; k++) {
			const line = lines[k];
			const metrics = context.measureText(line);
			const x = centerX - Math.min(metrics.width, maxWidth) * 0.5;

			// Draw text drop shadow
			context.fillStyle = this.config.dropShadowColor;
			context.fillText(
				line,
				x + this.config.dropShadowDistance,
				y + this.config.dropShadowDistance,
				maxWidth
			);

			// Draw text with bright color for better visibility against black overlay
			context.fillStyle = '#FFFFFF'; // White text for maximum visibility
			context.fillText(line, x, y, maxWidth);

			y += config.lineHeight;
			if (k < lines.length - 1) {
				y += config.lineSpacing;
			}
		}

		return y + config.marginBottom; // Return the new position after this text
	}

	private _renderText(
		context: CanvasRenderingContext2D,
		text: string,
		config: ImageRenderingTextConfig,
		centerX: number,
		bottomY: number,
		maxWidth: number
	): number {
		context.font = config.font;
		let y = bottomY - config.marginBottom;
		const lines = ImageRenderingService._getTextLines(
			context,
			text,
			maxWidth
		);
		for (let k = lines.length - 1; k >= 0; k--) {
			const line = lines[k];
			const metrics = context.measureText(line);
			const x = centerX - Math.min(metrics.width, maxWidth) * 0.5;

			// Draw text drop shadow
			context.fillStyle = this.config.dropShadowColor;
			context.fillText(
				line,
				x + this.config.dropShadowDistance,
				y + this.config.dropShadowDistance,
				maxWidth
			);

			// Draw text with bright color for better visibility against black overlay
			context.fillStyle = '#FFFFFF'; // White text for maximum visibility
			context.fillText(line, x, y, maxWidth);

			y -= config.lineHeight;
			if (k > 0) {
				y -= config.lineSpacing;
			}
		}
		return y;
	}

	/**
	 * Renders content in the bottom area, including logo and link
	 */
	private async _renderBottomAreaContent(
		context: CanvasRenderingContext2D,
		width: number,
		scale: number,
		bottomAreaY: number,
		bottomAreaHeight: number
	) {
		const bannerConfig = this.config.banner;

		try {
			// Draw Woolaroo logo on the left side of the bottom area
			const logoImage = await ImageRenderingService._loadImage(
				bannerConfig.logoURL
			);

			// Size the logo to be about 1/4 of the bottom area height
			const logoHeight = Math.min(bottomAreaHeight * 0.25, 80 * scale);
			const logoScale = logoHeight / logoImage.naturalHeight;
			const logoWidth = logoImage.naturalWidth * logoScale;

			// Position logo on the left side with padding
			const leftPadding = width * 0.1; // 10% of width as padding
			const logoX = leftPadding;
			const logoY = bottomAreaY + (bottomAreaHeight * 0.5) - (logoHeight / 2); // Centered vertically

			context.drawImage(logoImage, logoX, logoY, logoWidth, logoHeight);

			// Add the goo.gl/woolaroo link on the right side
			const linkText = "goo.gl/woolaroo";
			const rightPadding = width * 0.1; // 10% of width as padding

			// Set up text style for the link
			context.font = "bold 24px Arial";
			const linkMetrics = context.measureText(linkText);
			const linkWidth = linkMetrics.width;

			// Position link on the right side
			const linkX = width - rightPadding - linkWidth;
			const linkY = bottomAreaY + (bottomAreaHeight * 0.5) + 8; // Centered vertically, slightly adjusted

			// Draw the link text
			context.fillStyle = "#333333"; // Dark gray color for text
			context.fillText(linkText, linkX, linkY);

			// Optionally add an underline to make it look more like a link
			context.beginPath();
			context.strokeStyle = "#333333";
			context.lineWidth = 1;
			context.moveTo(linkX, linkY + 3);
			context.lineTo(linkX + linkWidth, linkY + 3);
			context.stroke();

		} catch (error) {
			// Fallback: If images fail to load, render text instead
			context.font = "bold 28px Arial";
			context.fillStyle = "#333333";

			// Render "Woolaroo" text on the left as fallback
			context.fillText("Woolaroo", width * 0.1, bottomAreaY + bottomAreaHeight * 0.5);

			// Render link on the right
			const linkText = "goo.gl/woolaroo";
			context.font = "bold 24px Arial";
			const linkMetrics = context.measureText(linkText);
			const linkX = width - width * 0.1 - linkMetrics.width;
			context.fillText(linkText, linkX, bottomAreaY + bottomAreaHeight * 0.5);
		}
	}

}
