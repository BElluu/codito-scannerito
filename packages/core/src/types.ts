export interface ScannerOptions {
    /**
     * Frame rate (default: 10)
     */
    fps?: number;
    
    /**
     * Preferred camera (default: 'environment')
     */
    facingMode?: 'user' | 'environment';
    
    /**
     * Barcode formats to scan
     */
    formats?: BarcodeFormat[];
    
    /**
     * Automatically normalize codes (remove AIM prefixes)
     */
    autoNormalize?: boolean;
    
    /**
     * Image quality (higher = more accurate, but slower)
     */
    constraints?: MediaTrackConstraints;
  }
  
  export type BarcodeFormat = 
    | 'QR_CODE'
    | 'CODE_128'
    | 'CODE_39'
    | 'EAN_13'
    | 'EAN_8'
    | 'UPC_A'
    | 'UPC_E'
    | 'DATA_MATRIX'
    | 'PDF_417'
    | 'AZTEC'
    | 'CODABAR'
    | 'ITF';
  
  export interface ScanResult {
    /**
     * Scanned code (normalized if autoNormalize=true)
     */
    text: string;
    
    /**
     * Original text before normalization
     */
    rawText: string;
    
    /**
     * Barcode format
     */
    format: string;
    
    /**
     * Timestamp of scanning
     */
    timestamp: number;
    
    /**
     * Was the code normalized (removed prefix)
     */
    wasNormalized: boolean;
  }
  
  export interface CameraDevice {
    id: string;
    label: string;
    isFrontFacing: boolean;
    isBackFacing: boolean;
  }
  
  export type ScanCallback = (result: ScanResult) => void;
  export type ErrorCallback = (error: Error) => void;