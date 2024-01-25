import type { BarcodeDetector, DetectedBarcode } from 'barcode-detector/pure';

import type { ROI, Track } from './types.js';

/**
 * Starts the camera and streams the video to the specified HTMLVideoElement.
 *
 * @param video - The HTMLVideoElement to display the camera stream.
 * @param stream - The MediaStream object representing the camera stream.
 * @param constraints - The MediaTrackConstraints to apply to the camera stream.
 * @returns The MediaStream object representing the camera stream.
 * @throws Error if camera access is not available in a secure context or if the Stream API is not supported.
 */
export async function startCamera(
	video: HTMLVideoElement,
	stream: MediaStream,
	constraints: MediaTrackConstraints
) {
	if (window.isSecureContext !== true) {
		throw new Error('Camera access requires a secure context');
	}

	if (navigator?.mediaDevices?.getUserMedia === undefined) {
		throw new Error('Stream API is not supported');
	}

	stream = await navigator.mediaDevices.getUserMedia({
		video: constraints,
		audio: false
	});

	video.srcObject = stream;
	video.play();

	await new Promise((resolve) => {
		video.addEventListener('loadeddata', resolve, { once: true });
	});

	// according to: https://oberhofer.co/mediastreamtrack-and-its-capabilities/#queryingcapabilities
	// on some devices, getCapabilities only returns a non-empty object after
	// some delay. there is no appropriate event so we have to add a constant timeout
	await new Promise((resolve) => {
		setTimeout(resolve, 500);
	});

	return stream;
}

/**
 * Retrieves the capabilities of the video track from the given MediaStream.
 *
 * @param stream The MediaStream containing the video track.
 * @returns An object containing the capabilities of the video track.
 */
export function getCapabilities(stream: MediaStream) {
	const [track] = stream.getVideoTracks();
	const capabilities = track.getCapabilities();

	return { capabilities };
}

function objectFitVideoTransform(video: HTMLVideoElement) {
	const matrix = new DOMMatrix();

	// center
	const videoOffsetCenter = new DOMPoint(video.offsetWidth / 2, video.offsetHeight / 2);
	const videoCenter = new DOMPoint(video.videoWidth / 2, video.videoHeight / 2);
	matrix.translateSelf(videoOffsetCenter.x - videoCenter.x, videoOffsetCenter.y - videoCenter.y);

	// scale (object-fit: cover)
	const scale = Math.max(
		video.offsetWidth / video.videoWidth,
		video.offsetHeight / video.videoHeight
	);
	matrix.scaleSelf(scale, scale, 1, videoCenter.x, videoCenter.y);

	const topLeft = matrix.inverse().transformPoint(new DOMPoint(0, 0));
	const bottomRight = matrix
		.inverse()
		.transformPoint(new DOMPoint(video.offsetWidth, video.offsetHeight));

	return {
		x: topLeft.x,
		y: topLeft.y,
		width: bottomRight.x - topLeft.x,
		height: bottomRight.y - topLeft.y
	};
}

/**
 * Sets up the canvas for barcode scanning.
 *
 * @param video - The HTMLVideoElement representing the video stream.
 * @param camera - The HTMLCanvasElement used for rendering the camera feed.
 * @param overlay - The HTMLCanvasElement used for rendering the barcode overlay.
 * @returns An object containing the CanvasRenderingContext2D for the camera and overlay canvases.
 */
export function setupCanvas(
	video: HTMLVideoElement,
	camera: HTMLCanvasElement,
	overlay: HTMLCanvasElement
) {
	const ctxCamera = camera.getContext('2d', {
		alpha: false,
		willReadFrequently: true
	}) as CanvasRenderingContext2D;
	const ctxOverlay = overlay.getContext('2d', {
		alpha: true,
		willReadFrequently: true
	}) as CanvasRenderingContext2D;

	const { width, height } = objectFitVideoTransform(video);
	camera.width = width;
	camera.height = height;
	overlay.width = width;
	overlay.height = height;

	return { ctxCamera, ctxOverlay };
}

/**
 * Draws the video onto the canvas (with object-fit: cover transformation).
 *
 * @param ctxCamera - The 2D rendering context of the camera canvas.
 * @param camera - The HTML canvas element representing the camera.
 * @param video - The HTML video element containing the video feed.
 */
export function drawVideo(
	ctxCamera: CanvasRenderingContext2D,
	camera: HTMLCanvasElement,
	video: HTMLVideoElement
) {
	const { x, y, width, height } = objectFitVideoTransform(video);
	ctxCamera.clearRect(0, 0, camera.width, camera.height);
	ctxCamera.drawImage(video, x, y, width, height, 0, 0, camera.width, camera.height);
}

/**
 * Detects barcodes within the specified regions of interest (ROIs) in a canvas.
 *
 * @param detector - The barcode detector instance used for barcode detection.
 * @param ctxCamera - The 2D rendering context of the camera canvas.
 * @param camera - The HTML canvas element representing the camera feed.
 * @param ctxOverlay - The 2D rendering context of the overlay canvas.
 * @param overlay - The HTML canvas element representing the overlay.
 * @param rois - An array of regions of interest (ROIs) where barcodes will be detected.
 * @param showROIS - A boolean indicating whether to display the ROIs on the overlay.
 * @param track - An optional callback function for tracking detected barcodes.
 * @returns A promise that resolves to an array of detected barcodes.
 */
export async function detect(
	detector: BarcodeDetector,
	ctxCamera: CanvasRenderingContext2D,
	camera: HTMLCanvasElement,
	ctxOverlay: CanvasRenderingContext2D,
	overlay: HTMLCanvasElement,
	rois: ROI[],
	showROIS: boolean,
	track: Track | undefined
): Promise<DetectedBarcode[]> {
	ctxOverlay.clearRect(0, 0, overlay.width, overlay.height);

	const allDetections = [];

	for (const roi of rois) {
		const imageData = ctxCamera.getImageData(
			roi.x * camera.width,
			roi.y * camera.height,
			roi.width * camera.width,
			roi.height * camera.height
		);

		const detections = await detector.detect(imageData);
		const adjustedDetections = detections.map((detection) => {
			return {
				...detection,
				boundingBox: DOMRectReadOnly.fromRect({
					x: detection.boundingBox.x + roi.x * camera.width,
					y: detection.boundingBox.y + roi.y * camera.height,
					width: detection.boundingBox.width,
					height: detection.boundingBox.height
				})
			};
		});

		allDetections.push(...adjustedDetections);

		if (showROIS) {
			ctxOverlay.strokeStyle = 'rgba(0, 0, 0, 0.3)';
			ctxOverlay.lineWidth = 3;
			ctxOverlay.strokeRect(
				roi.x * camera.width,
				roi.y * camera.height,
				roi.width * camera.width,
				roi.height * camera.height
			);
		}

		if (track && adjustedDetections.length > 0) {
			track(adjustedDetections, ctxOverlay);
		}
	}

	return allDetections;
}
