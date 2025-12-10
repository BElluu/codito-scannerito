import {
  BrowserMultiFormatReader,
  DecodeHintType,
  BarcodeFormat as ZXingFormat,
  Result
} from '@zxing/library';
import type { 
  ScannerOptions, 
  ScanResult, 
  CameraDevice,
  ScanCallback,
  ErrorCallback,
  BarcodeFormat
} from './types';

const ALL_FORMATS: BarcodeFormat[] = [
  'QR_CODE', 'CODE_128', 'CODE_93', 'CODE_39', 'EAN_13', 'EAN_8',
  'UPC_A', 'UPC_E', 'DATA_MATRIX', 'PDF_417', 'AZTEC', 'CODABAR', 'ITF'
];

type ResolvedScannerOptions = Required<Omit<ScannerOptions, 'targetBoxWidth' | 'targetBoxHeight'>> & Pick<ScannerOptions, 'targetBoxWidth' | 'targetBoxHeight'>;

export class BarcodeScanner {
  private reader: BrowserMultiFormatReader;
  private options: ResolvedScannerOptions;
  private isScanning = false;
  private videoElement: HTMLVideoElement | null = null;
  private stream: MediaStream | null = null;
  private canvas: HTMLCanvasElement;
  private canvasContext: CanvasRenderingContext2D;
  private scanInterval: number | null = null;

  constructor(options: ScannerOptions = {}) {
    this.options = {
      fps: options.fps ?? 10,
      facingMode: options.facingMode ?? 'environment',
      formats: options.formats ?? ALL_FORMATS,
      autoNormalize: options.autoNormalize ?? true,
      constraints: options.constraints ?? {},
      targetBoxWidth: options.targetBoxWidth,
      targetBoxHeight: options.targetBoxHeight
    };
    
    const hints = new Map();
    hints.set(DecodeHintType.TRY_HARDER, true);
    
    const zxingFormats = this.options.formats.map(f => this.mapFormatToZXing(f));
    hints.set(DecodeHintType.POSSIBLE_FORMATS, zxingFormats);
    
    this.reader = new BrowserMultiFormatReader(hints);
    
    this.canvas = document.createElement('canvas');
    this.canvasContext = this.canvas.getContext('2d', { 
      willReadFrequently: true 
    })!;
  }

  private mapFormatToZXing(format: BarcodeFormat): ZXingFormat {
    const mapping: Record<BarcodeFormat, ZXingFormat> = {
      'QR_CODE': ZXingFormat.QR_CODE,
      'CODE_128': ZXingFormat.CODE_128,
      'CODE_93': ZXingFormat.CODE_93,
      'CODE_39': ZXingFormat.CODE_39,
      'EAN_13': ZXingFormat.EAN_13,
      'EAN_8': ZXingFormat.EAN_8,
      'UPC_A': ZXingFormat.UPC_A,
      'UPC_E': ZXingFormat.UPC_E,
      'DATA_MATRIX': ZXingFormat.DATA_MATRIX,
      'PDF_417': ZXingFormat.PDF_417,
      'AZTEC': ZXingFormat.AZTEC,
      'CODABAR': ZXingFormat.CODABAR,
      'ITF': ZXingFormat.ITF
    };
    return mapping[format];
  }

  async start(
    videoElement: HTMLVideoElement,
    onScan: ScanCallback,
    onError?: ErrorCallback
  ): Promise<void> {
    if (this.isScanning) {
      throw new Error('Scanner is already running');
    }

    this.videoElement = videoElement;

    const constraints: MediaStreamConstraints = {
      video: {
        facingMode: this.options.facingMode,
        width: { ideal: 1280 },
        height: { ideal: 720 },
        ...this.options.constraints
      }
    };

    try {
      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      videoElement.srcObject = this.stream;
      videoElement.setAttribute('playsinline', 'true');
      videoElement.muted = true;
      
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Video timeout')), 10000);
        
        const handleReady = () => {
          clearTimeout(timeout);
          videoElement.removeEventListener('loadedmetadata', handleReady);
          videoElement.play()
            .then(() => resolve())
            .catch(reject);
        };
        
        if (videoElement.readyState >= HTMLMediaElement.HAVE_METADATA) {
          handleReady();
        } else {
          videoElement.addEventListener('loadedmetadata', handleReady);
        }
      });

      this.canvas.width = videoElement.videoWidth;
      this.canvas.height = videoElement.videoHeight;
      this.isScanning = true;

      this.startScanLoop(onScan, onError);
      
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to start');
      onError?.(err);
      throw err;
    }
  }

  private startScanLoop(onScan: ScanCallback, onError?: ErrorCallback): void {
    const scanIntervalMs = 1000 / this.options.fps;
    
    const scan = async () => {
      if (!this.isScanning || !this.videoElement) return;
      
      try {
        let dataUrl: string;
        
        if (this.options.targetBoxWidth && this.options.targetBoxHeight) {
          const videoWidth = this.videoElement.videoWidth;
          const videoHeight = this.videoElement.videoHeight;
          
          const regionWidth = (this.options.targetBoxWidth / 100) * videoWidth;
          const regionHeight = (this.options.targetBoxHeight / 100) * videoHeight;
          const regionX = (videoWidth - regionWidth) / 2;
          const regionY = (videoHeight - regionHeight) / 2;
          
          this.canvas.width = regionWidth;
          this.canvas.height = regionHeight;
          
          this.canvasContext.drawImage(
            this.videoElement,
            regionX, regionY, regionWidth, regionHeight,
            0, 0, regionWidth, regionHeight
          );
          
          dataUrl = this.canvas.toDataURL('image/png');
        } else {
          this.canvas.width = this.videoElement.videoWidth;
          this.canvas.height = this.videoElement.videoHeight;
          
          this.canvasContext.drawImage(
            this.videoElement, 
            0, 0, 
            this.canvas.width, 
            this.canvas.height
          );
          
          dataUrl = this.canvas.toDataURL('image/png');
        }
        
        const result = await this.reader.decodeFromImageUrl(dataUrl);
        
        if (result) {
          onScan(this.createScanResult(result));
          return;
        }
      } catch (error) {}
      
      if (this.isScanning) {
        this.scanInterval = window.setTimeout(scan, scanIntervalMs);
      }
    };

    scan();
  }

  async stop(): Promise<void> {
    this.isScanning = false;
    
    if (this.scanInterval) {
      clearTimeout(this.scanInterval);
      this.scanInterval = null;
    }
    
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    
    if (this.videoElement) {
      this.videoElement.srcObject = null;
      this.videoElement = null;
    }
    
    this.reader.reset();
  }

  async scanImage(file: File): Promise<ScanResult> {
    return new Promise((resolve, reject) => {
      const fileReader = new FileReader();
      
      fileReader.onload = async (e) => {
        try {
          const dataUrl = e.target?.result as string;
          const result = await this.reader.decodeFromImageUrl(dataUrl);
          resolve(this.createScanResult(result));
        } catch (error) {
          reject(error instanceof Error ? error : new Error('Failed to decode'));
        }
      };
      
      fileReader.onerror = () => reject(new Error('Failed to read file'));
      fileReader.readAsDataURL(file);
    });
  }

  async listCameras(): Promise<CameraDevice[]> {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices
        .filter(d => d.kind === 'videoinput')
        .map(device => ({
          id: device.deviceId,
          label: device.label || `Camera ${device.deviceId.slice(0, 5)}`,
          isFrontFacing: device.label.toLowerCase().includes('front'),
          isBackFacing: device.label.toLowerCase().includes('back')
        }));
    } catch {
      return [];
    }
  }

  async switchCamera(
    deviceId: string,
    videoElement: HTMLVideoElement,
    onScan: ScanCallback,
    onError?: ErrorCallback
  ): Promise<void> {
    await this.stop();
    this.options.constraints = { ...this.options.constraints, deviceId: { exact: deviceId } };
    await this.start(videoElement, onScan, onError);
  }

  private normalizeBarcode(code: string): string {
    return code
      .replace(/^\][A-Za-z0-9]{1,2}/, '') // AIM prefix
      .replace(/[\x00-\x1F\x7F]/g, '')     // Control chars
      .trim();
  }

  private createScanResult(result: Result): ScanResult {
    const rawText = result.getText();
    const normalizedText = this.options.autoNormalize 
      ? this.normalizeBarcode(rawText)
      : rawText;

    return {
      text: normalizedText,
      rawText: rawText,
      format: ZXingFormat[result.getBarcodeFormat()],
      timestamp: Date.now(),
      wasNormalized: rawText !== normalizedText
    };
  }

  getIsScanning(): boolean {
    return this.isScanning;
  }

  getOptions(): Readonly<ResolvedScannerOptions> {
    return { ...this.options };
  }
}
