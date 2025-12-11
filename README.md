# 📷 Codito Scannerito

Fast and simple barcode/QR code scanning library for web applications.

You can try on our DEMO: https://scanner.devopsowy.pl/

## 📦 Installation

```bash
# For React projects
npm install @coditoscannerito/react

# Core only (without React)
npm install @coditoscannerito/core
```

---

## 🚀 Quick Start (React)

```tsx
import { BarcodeScanner } from '@coditoscannerito/react';
import '@coditoscannerito/react/styles.css';

function App() {
  const handleScan = (result) => {
    console.log('Scanned:', result.text);
    console.log('Format:', result.format);
  };

  return (
    <BarcodeScanner 
      onScan={handleScan}
      autoStart={true}
    />
  );
}
```

---

## 📋 Supported Barcode Formats

| Format | Description |
|--------|-------------|
| `QR_CODE` | QR Code |
| `CODE_128` | Code 128 (most common barcode) |
| `CODE_39` | Code 39 |
| `CODE_93` | Code 93 |
| `EAN_13` | EAN-13 (European product codes) |
| `EAN_8` | EAN-8 |
| `UPC_A` | UPC-A (US product codes) |
| `UPC_E` | UPC-E |
| `DATA_MATRIX` | Data Matrix (2D codes) |
| `PDF_417` | PDF417 (documents, IDs) |
| `AZTEC` | Aztec (tickets, boarding passes) |
| `CODABAR` | Codabar (libraries, blood banks) |
| `ITF` | ITF (Interleaved 2 of 5) |

**By default, all formats are enabled.** Use `formats` prop to limit scanning to specific formats:

### Selecting Formats

```tsx
// QR codes only
<BarcodeScanner 
  formats={['QR_CODE']}
  onScan={handleScan}
/>

// Product barcodes only
<BarcodeScanner 
  formats={['EAN_13', 'EAN_8', 'UPC_A', 'UPC_E']}
  onScan={handleScan}
/>

// Logistics/warehouse codes
<BarcodeScanner 
  formats={['CODE_128', 'CODE_39', 'ITF']}
  onScan={handleScan}
/>
```

---

## ⚙️ Configuration Options

### `<BarcodeScanner>` Component

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `onScan` | `(result: ScanResult) => void` | - | **Required.** Callback after scanning |
| `onError` | `(error: Error) => void` | - | Callback on error |
| `formats` | `BarcodeFormat[]` | All formats | Formats to scan |
| `autoStart` | `boolean` | `false` | Auto-start scanning |
| `fps` | `number` | `10` | Frames per second |
| `facingMode` | `'user' \| 'environment'` | `'environment'` | Camera (front/back) |
| `autoNormalize` | `boolean` | `true` | Normalize scanned codes |
| `showOverlay` | `boolean` | `true` | Show target frame |
| `showControls` | `boolean` | `true` | Show buttons |
| `showLastResult` | `boolean` | `true` | Show last result |
| `playSound` | `boolean` | `true` | Beep on scan |
| `targetBoxWidth` | `number` | `70` | Target frame width (%) |
| `targetBoxHeight` | `number` | `40` | Target frame height (%) |
| `startButtonText` | `string` | `'Start Scanning'` | Start button text |
| `stopButtonText` | `string` | `'Stop Scanning'` | Stop button text |
| `showFileInput` | `boolean` | `false` | Show button to scan from image file |
| `fileInputText` | `string` | `'Scan from File'` | File input button text |
| `showCameraSelect` | `boolean` | `true` | Show camera select dropdown (when multiple cameras) |
| `className` | `string` | `''` | Custom CSS class |

---

## 📁 Scanning from Image File

You can scan barcodes from image files (photos) instead of using a camera. This is useful for:
- Scanning saved barcode images
- Situations where camera access is not available
- Testing and development

### Using Component

Enable file input with `showFileInput` prop:

```tsx
<BarcodeScanner 
  onScan={handleScan}
  showFileInput={true}
  fileInputText="Upload Image"
/>
```

### Using Hook

Use `scanFile` function from the hook:

```tsx
const { scanFile } = useBarcodeScanner({ onScan: handleScan });

const handleFileUpload = async (e) => {
  const file = e.target.files[0];
  try {
    const result = await scanFile(file);
    console.log('Code from file:', result.text);
  } catch (err) {
    console.error('No code found in image');
  }
};

<input type="file" accept="image/*" onChange={handleFileUpload} />
```

### Using Core API

```typescript
const scanner = new BarcodeScanner();
const result = await scanner.scanImage(file);
console.log('Scanned:', result.text);
```

---

## 🔧 Code Normalization

The `autoNormalize` option automatically cleans scanned codes:

- **Removes AIM prefixes** (e.g., `]C1` from Code 128)
- **Removes control characters** (ASCII 0-31, 127)
- **Trims whitespace**

```tsx
// With normalization (default)
<BarcodeScanner 
  autoNormalize={true}
  onScan={(result) => {
    console.log(result.text);          // "ABC123"
    console.log(result.rawText);       // "]C1ABC123"
    console.log(result.wasNormalized); // true
  }}
/>
```

---

## 🎣 `useBarcodeScanner` Hook

For full control, use the hook:

```tsx
import { useBarcodeScanner } from '@coditoscannerito/react';

function MyScanner() {
  const {
    videoRef,
    isScanning,
    lastResult,
    error,
    cameras,
    selectedCamera,
    startScanning,
    stopScanning,
    switchCamera,
    scanFile
  } = useBarcodeScanner({
    formats: ['CODE_128', 'QR_CODE'],
    fps: 15,
    autoNormalize: true,
    onScan: (result) => console.log('Code:', result.text),
    onError: (err) => console.error('Error:', err)
  });

  return (
    <div>
      <video ref={videoRef} />
      
      <button onClick={startScanning} disabled={isScanning}>
        Start
      </button>
      
      <button onClick={stopScanning} disabled={!isScanning}>
        Stop
      </button>
      
      {cameras.length > 1 && (
        <select onChange={(e) => switchCamera(e.target.value)}>
          {cameras.map(cam => (
            <option key={cam.id} value={cam.id}>{cam.label}</option>
          ))}
        </select>
      )}
      
      {lastResult && <p>Result: {lastResult.text}</p>}
      {error && <p>Error: {error.message}</p>}
    </div>
  );
}
```

---

## 🔩 Core API (without React)

```typescript
import { BarcodeScanner } from '@coditoscannerito/core';

const scanner = new BarcodeScanner({
  formats: ['CODE_128', 'QR_CODE'],
  fps: 10,
  facingMode: 'environment',
  autoNormalize: true
});

const videoElement = document.querySelector('video');

await scanner.start(
  videoElement,
  (result) => {
    console.log('Scanned:', result.text);
    console.log('Format:', result.format);
  },
  (error) => {
    console.error('Error:', error);
  }
);

await scanner.stop();

const cameras = await scanner.listCameras();
console.log(cameras);

await scanner.switchCamera(cameras[0].id, videoElement, onScan, onError);

const result = await scanner.scanImage(file);
```

---

## 📱 Requirements

- **HTTPS** - Camera requires secure connection
- **Modern browser** - Chrome 60+, Firefox 55+, Safari 11+, Edge 79+
- **Camera permission** - User must grant access

### Tips for Better Scanning

1. **Good lighting** - Avoid shadows on the code
2. **Steady image** - Hold phone still
3. **Proper distance** - 15-30 cm from code
4. **Full code visible** - Entire code must be in frame

---

## 📊 `ScanResult` Structure

```typescript
interface ScanResult {
  text: string;          // Scanned code (after normalization)
  rawText: string;       // Original code (before normalization)
  format: string;        // Code format (e.g., "CODE_128", "QR_CODE")
  timestamp: number;     // Unix timestamp of scan
  wasNormalized: boolean; // Whether code was normalized
}
```

---

## 🎨 Styling

Import default styles:

```tsx
import '@coditoscannerito/react/styles.css';
```

Or override CSS classes:

```css
.barcode-scanner { /* container */ }
.barcode-scanner__video { /* video element */ }
.barcode-scanner__overlay { /* overlay with frame */ }
.barcode-scanner__target-box { /* target frame */ }
.barcode-scanner__controls { /* buttons */ }
.barcode-scanner__button { /* button */ }
.barcode-scanner__result { /* scan result */ }
.barcode-scanner__error { /* error message */ }
```

---

## Credits
To decode barcode and QR code we use `Zxing-js` https://github.com/zxing-js/library

---

## 📄 License

Apache-2.0
