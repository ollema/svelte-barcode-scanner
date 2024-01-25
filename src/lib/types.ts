import type { DetectedBarcode } from 'barcode-detector/pure';

/**
 * Represents a region of interest (ROI) with its position and dimensions.
 */
export type ROI = {
	x: number;
	y: number;
	width: number;
	height: number;
};

/**
 * Represents the events emitted by the barcode scanner.
 */
export type Events = {
	/**
	 * Event emitted when one or more barcodes are detected.
	 * @param detections - The detected barcodes.
	 */
	detect: { detections: DetectedBarcode[] };

	/**
	 * Event emitted when the barcode scanner is initialized.
	 * @param capabilities - The media track capabilities.
	 */
	init: { capabilities: MediaTrackCapabilities };
};

/**
 * Represents a function that tracks detected barcodes and renders them on the overlay canvas.
 * @param detections - An array of detected barcodes.
 * @param ctxOverlay - The rendering context of the canvas.
 */
export type Track = (detections: DetectedBarcode[], ctxOverlay: CanvasRenderingContext2D) => void;
