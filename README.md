# Svelte Barcode Scanner

A Svelte component for detecting QR-codes, EAN-barcodes and other barcode formats.

## Installation

```bash
npm install svelte-barcode-scanner
```

or

```bash
pnpm install svelte-barcode-scanner
```

## Usage

```svelte
<script lang="ts">
	import { BarcodeScanner } from 'svelte-barcode-scanner';
</script>

<BarcodeScanner />
```

The `<BarcodeScanner />` component is responsive and fills the available space with `object-fit: cover`.

This enables you to embed the component inside a div with a fixed aspect ratio to get a predictable size regardless of the aspect ratio of the camera feed:

```svelte
<script lang="ts">
	import { BarcodeScanner } from 'svelte-barcode-scanner';
</script>

<div class="barcode-scanner">
	<BarcodeScanner />
</div>

<style>
	.barcode-scanner {
		width: 100%;
		max-width: 384px;
		aspect-ratio: 1;
	}
</style>
```

A live demo and an API reference is being worked on.

## License

[MIT](./LICENSE)
