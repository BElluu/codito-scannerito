export { BarcodeScanner } from './BarcodeScanner';
export { useBarcodeScanner } from './useBarcodeScanner';
export type { BarcodeScannerProps } from './BarcodeScanner';
export type { UsBarcodeScannerOptions, UsBarcodeScannerReturn } from './useBarcodeScanner';

// Re-export types from core
export type {
  ScannerOptions,
  BarcodeFormat,
  ScanResult,
  CameraDevice
} from '@coditoscannerito/core';