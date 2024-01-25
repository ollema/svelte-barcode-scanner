<script lang="ts">
	import { startCamera, setupCanvas, drawVideo, detect, stopCamera } from './barcode-scanner.js';
	import type { Events, ROI, Track } from './types.js';

	import 'rvfc-polyfill';
	import { BarcodeDetector, type BarcodeFormat } from 'barcode-detector/pure';

	import { createEventDispatcher, onMount, onDestroy } from 'svelte';

	const dispatch = createEventDispatcher<Events>();

	export let formats: BarcodeFormat[] | undefined = undefined;
	// false positive because for some reason MediaTrackConstraints is not recognized
	// eslint-disable-next-line no-undef
	export let constraints: MediaTrackConstraints = { facingMode: 'environment' };
	export let ROIs: ROI[] = [{ x: 0, y: 0, width: 1, height: 1 }];
	export let showROIs: boolean = false;
	export let track: Track | undefined = undefined;

	let stream: MediaStream;
	let hidden: boolean = true;
	let vfc: number;

	let video: HTMLVideoElement;
	let camera: HTMLCanvasElement;
	let overlay: HTMLCanvasElement;

	onMount(async () => {
		const detector = new BarcodeDetector({ formats: formats });
		const capabilities = await startCamera(video, stream, constraints);
		const { ctxCamera, ctxOverlay } = setupCanvas(video, camera, overlay);

		dispatch('init', capabilities);
		hidden = false;

		async function processFrame() {
			drawVideo(ctxCamera, camera, video);
			const detections = await detect(
				detector,
				ctxCamera,
				camera,
				ctxOverlay,
				overlay,
				ROIs,
				showROIs,
				track
			);
			if (detections.length > 0) {
				dispatch('detect', { detections: detections });
			}
			vfc = video.requestVideoFrameCallback(processFrame);
		}

		vfc = video.requestVideoFrameCallback(processFrame);
	});

	onDestroy(() => {
		if (vfc) {
			video.cancelVideoFrameCallback(vfc);
		}
		if (stream) {
			stopCamera(stream);
		}
	});
</script>

<div class="barcode-scanner">
	<!-- svelte-ignore a11y-media-has-caption -->
	<video class:hidden autoplay playsinline bind:this={video} />
	<canvas class:hidden bind:this={camera} />
	<canvas class:hidden bind:this={overlay} />
	<div>
		<slot />
	</div>
</div>

<style>
	.barcode-scanner {
		position: relative;
		width: 100%;
		height: 100%;
		z-index: 0;
		display: block;
	}

	.barcode-scanner > video {
		position: absolute;
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
		visibility: hidden;
	}

	.barcode-scanner > canvas {
		position: absolute;
		width: 100%;
		height: 100%;
		display: block;
	}

	.barcode-scanner > div {
		position: absolute;
		width: 100%;
		height: 100%;
		display: block;
	}

	.hidden {
		display: none;
	}
</style>
