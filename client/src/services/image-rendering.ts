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

		// Add full-width area at the bottom with height of 420px
		const bottomAreaHeight = width <= 480 ? 110 : 260; // Reduced by half on mobile
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

		// Adjust text sizes based on screen width
		const textScale = width <= 480 ? 0.4 : 0.85; // Further reduced text size on mobile
		this.config.translation.font = width <= 480 ? "400 28px Arial" : "400 48px Arial"; // Reduced weight, increased size
		this.config.transliteration.font = width <= 480 ? "16px Arial" : "30px Arial";
		this.config.languages.font = width <= 480 ? "14px Arial" : "24px Arial";
		this.config.originalWord.font = width <= 480 ? "400 32px Arial" : "400 52px Arial"; // Reduced weight, increased size

		// Scale line heights and spacing
		this.config.translation.lineHeight *= textScale;
		this.config.translation.lineSpacing *= textScale;
		this.config.translation.marginBottom *= textScale;
		this.config.transliteration.lineHeight *= textScale;
		this.config.transliteration.lineSpacing *= textScale;
		this.config.transliteration.marginBottom *= textScale;
		this.config.languages.lineHeight *= textScale;
		this.config.languages.lineSpacing *= textScale;
		this.config.languages.marginBottom *= textScale;
		this.config.originalWord.lineHeight *= textScale;
		this.config.originalWord.lineSpacing *= textScale;
		this.config.originalWord.marginBottom *= textScale;

		// Further reduce padding on mobile
		this.config.padding = width <= 480 ? 4 : 32;

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
		// Start at top with padding
		let y = (this.config.padding * 2) / scale;

		// Calculate bottom area height based on screen width
		const bottomAreaHeight = width <= 480 ? 110 : 260;

		// Limit text to 90% of the screen width on mobile, 60% on desktop
		const textAreaWidth = width <= 480 ? width * 0.9 : width * 0.6;
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
			// Create a modified config for language description with increased line height and spacing
			const descriptionConfig = {
				...this.config.languages,
				lineHeight: this.config.languages.lineHeight * 1.5, // Increase line height by 50%
				lineSpacing: this.config.languages.lineSpacing * 2, // Double the line spacing
				marginBottom: this.config.languages.marginBottom * 1.5 // Increase bottom margin
			};

			elements.push({
				text: endangeredLanguage.shortDescriptions['en'],
				config: descriptionConfig
			});
		}

		// Calculate total height needed for all elements
		let totalElementHeight = 0;
		for (const element of elements) {
			context.font = element.config.font;
			const lines = ImageRenderingService._getTextLines(context, element.text, maxTextWidth);
			const elementHeight = lines.length * element.config.lineHeight +
				(lines.length - 1) * element.config.lineSpacing +
				element.config.marginBottom;
			totalElementHeight += elementHeight;
		}

		// Calculate available height (excluding top and bottom padding)
		const availableHeight = (height - bottomAreaHeight - (this.config.padding * 4)) / scale;

		// Calculate equal spacing between elements
		const equalSpacing = (availableHeight - totalElementHeight) / (elements.length - 1);

		// Render all elements with equal spacing
		let currentY = y;
		for (const element of elements) {
			currentY = this._renderTextFromTop(
				context,
				element.text,
				element.config,
				centerX,
				currentY,
				maxTextWidth
			);

			// Add equal spacing after each element except the last one
			if (element !== elements[elements.length - 1]) {
				currentY += equalSpacing;
			}
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

			// Increase line height for better readability
			y += config.lineHeight * 1.2; // Increased by 20% for better spacing
			if (k < lines.length - 1) {
				y += config.lineSpacing * 1.5; // Increased line spacing between lines
			}
		}

		return y + config.marginBottom; // Return the new position after this text
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
			// Load both images first
			const logoImage = await ImageRenderingService._loadImage(
				bannerConfig.logoURL
			);
			const tagImage = await ImageRenderingService._loadImage(
				bannerConfig.tagURL
			);

			// Calculate the desired width based on screen size
			const desiredWidth = width <= 480 ? width * 0.3 : width * 0.15; // 30% on mobile, 15% on desktop/tablet

			// Calculate scales for both images to match the desired width
			const logoScale = desiredWidth / logoImage.naturalWidth;
			const tagScale = desiredWidth / tagImage.naturalWidth;

			// Calculate heights based on the scales
			const logoHeight = logoImage.naturalHeight * logoScale;
			const tagHeight = tagImage.naturalHeight * tagScale;

			// Calculate total height of both images plus spacing
			const totalHeight = logoHeight + tagHeight + 8; // Reduced spacing to 8px

			// Position both images on the left side with reduced padding
			const leftPadding = width <= 480 ? width * 0.05 : width * 0.03; // 5% on mobile, 3% on desktop/tablet
			const logoX = leftPadding;
			const tagX = leftPadding;

			// Center both images vertically in the bottom section
			const startY = bottomAreaY + (bottomAreaHeight - totalHeight) / 2;
			const logoY = startY;
			const tagY = startY + logoHeight + 8; // Reduced spacing to 8px

			// Save the current context state
			context.save();

			// Reset the transform to draw the images at the correct scale
			context.setTransform(1, 0, 0, 1, 0, 0);

			// Draw the logo
			context.drawImage(logoImage, logoX, logoY, desiredWidth, logoHeight);

			// Draw the tag
			context.drawImage(tagImage, tagX, tagY, desiredWidth, tagHeight);

			// Add Woolaroo URL text on the right side
			context.font = width <= 480 ? "500 24px Arial" : "500 32px Arial"; // Increased size and added medium weight
			context.fillStyle = "#1a73e8"; // Google blue color
			const urlText = "goo.gle/Woolaroo";
			const textMetrics = context.measureText(urlText);
			const rightPadding = width <= 480 ? width * 0.05 : width * 0.03; // Same padding as left side
			const textX = width - textMetrics.width - rightPadding;
			const textY = bottomAreaY + (bottomAreaHeight / 2); // Center vertically
			context.fillText(urlText, textX, textY);

			// Restore the previous context state
			context.restore();

		} catch (error) {
			console.error('Failed to render bottom area content:', error);
			// Fallback: If images fail to load, render text instead
			context.font = "bold 28px Arial";
			context.fillStyle = "#333333";

			// Calculate center position for fallback text
			const centerY = bottomAreaY + bottomAreaHeight / 2;

			// Render "Woolaroo" text on the left as fallback
			context.fillText("Woolaroo", width * 0.05, centerY - 20);

			// Render "Google Arts & Culture" text below the logo
			context.fillText("Google Arts & Culture", width * 0.05, centerY + 20);

			// Add Woolaroo URL text on the right side
			context.font = "500 32px Arial"; // Increased size and added medium weight
			context.fillStyle = "#1a73e8"; // Google blue color
			const urlText = "goo.gle/Woolaroo";
			const textMetrics = context.measureText(urlText);
			const textX = width - textMetrics.width - (width * 0.03);
			context.fillText(urlText, textX, centerY);
		}
	}

}
