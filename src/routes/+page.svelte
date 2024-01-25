<script lang="ts">
	import type { DetectedBarcode } from 'barcode-detector/pure';

	import { BarcodeScanner } from '$lib/index.js';

	let loading = true;

	const requiredNumberOfConsistentDetections = 5;
	let lastDetectedBarcode = '';
	let consistentDetectionCount = 0;

	let barcodes: string[] = [];

	function handleInit() {
		loading = false;
	}

	async function handleDetect(e: CustomEvent<{ detections: DetectedBarcode[] }>) {
		for (const detection of e.detail.detections) {
			const detectedBarcode = detection.rawValue;

			if (detectedBarcode !== lastDetectedBarcode) {
				lastDetectedBarcode = detectedBarcode;
				consistentDetectionCount = 0;
			} else {
				consistentDetectionCount++;
			}

			if (consistentDetectionCount >= requiredNumberOfConsistentDetections) {
				barcodes = [...barcodes, detectedBarcode];
				lastDetectedBarcode = '';
				consistentDetectionCount = 0;
				break;
			} else {
				return;
			}
		}
	}
</script>

<div class="container">
	<BarcodeScanner
		on:init={handleInit}
		on:detect={handleDetect}
		formats={['qr_code', 'ean_8', 'ean_13']}
		ROIs={[
			{
				x: 0.01,
				y: 0.01,
				width: 0.98,
				height: 0.98
			},
			{
				x: 0.1,
				y: 0.2,
				width: 0.8,
				height: 0.6
			},
			{
				x: 0.025,
				y: 0.3,
				width: 0.95,
				height: 0.4
			}
		]}
		showROIs={true}
		track={(detections, ctxOverlay) => {
			for (const detection of detections) {
				ctxOverlay.strokeStyle = 'rgba(255, 0, 0, 0.5)';
				ctxOverlay.lineWidth = 4;
				ctxOverlay.strokeRect(
					detection.boundingBox.x,
					detection.boundingBox.y,
					detection.boundingBox.width,
					detection.boundingBox.height
				);
			}
		}}
	>
		{#if loading}
			<div class="loading">Loading...</div>
		{/if}
	</BarcodeScanner>
	{#each barcodes as barcode}
		<div>{barcode}</div>
	{/each}
</div>

<style>
	.container {
		width: 100%;
		max-width: 384px;
		margin: 0 auto;
		aspect-ratio: 1;
	}

	.loading {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
	}
</style>
