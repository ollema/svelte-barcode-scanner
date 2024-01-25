import type { DetectedBarcode } from 'barcode-detector/pure';

export type ROI = {
	x: number;
	y: number;
	width: number;
	height: number;
};

export type Events = {
	detect: { detections: DetectedBarcode[] };
	init: { capabilities: MediaTrackCapabilities };
};

export type Track = (detections: DetectedBarcode[], ctxOverlay: CanvasRenderingContext2D) => void;
