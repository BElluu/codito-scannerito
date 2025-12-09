import { useEffect, useRef, useState, useCallback } from 'react';
import { BarcodeScanner, ScanResult, CameraDevice } from '@coditoscannerito/core';
import type { ScannerOptions } from '@coditoscannerito/core';

export interface UsBarcodeScannerOptions extends ScannerOptions {
  /**
   * Callback called after each scan
   */
  onScan?: (result: ScanResult) => void;
  
  /**
   * Callback called when an error occurs
   */
  onError?: (error: Error) => void;
  
  /**
   * Automatically start scanning after mounting
   */
  autoStart?: boolean;
}

export interface UsBarcodeScannerReturn {
  /**
   * Ref to video element
   */
  videoRef: React.RefObject<HTMLVideoElement>;
  
  /**
   * Is scanner active
   */
  isScanning: boolean;
  
  /**
   * Last scanned code
   */
  lastResult: ScanResult | null;
  
  /**
   * Last error
   */
  error: Error | null;
  
  /**
   * List of available cameras
   */
  cameras: CameraDevice[];
  
  /**
   * Currently selected camera
   */
  selectedCamera: string | null;
  
  /**
   * Start scanning
   */
  startScanning: () => Promise<void>;
  
  /**
   * Stop scanning
   */
  stopScanning: () => Promise<void>;
  
  /**
   * Switch camera
   */
  switchCamera: (deviceId: string) => Promise<void>;
  
  /**
   * Scan file
   */
  scanFile: (file: File) => Promise<ScanResult>;
}

export function useBarcodeScanner(
  options: UsBarcodeScannerOptions = {}
): UsBarcodeScannerReturn {
  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerRef = useRef<BarcodeScanner | null>(null);
  
  const [isScanning, setIsScanning] = useState(false);
  const [lastResult, setLastResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string | null>(null);

  useEffect(() => {
    scannerRef.current = new BarcodeScanner(options);

    scannerRef.current.listCameras()
      .then(setCameras)
      .catch(err => setError(err));

    return () => {
      scannerRef.current?.stop();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleScan = useCallback((result: ScanResult) => {
    setLastResult(result);
    setError(null);
    options.onScan?.(result);
  }, [options.onScan]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleError = useCallback((err: Error) => {
    setError(err);
    options.onError?.(err);
  }, [options.onError]); // eslint-disable-line react-hooks/exhaustive-deps

  const startScanning = useCallback(async () => {
    if (!videoRef.current || !scannerRef.current) {
      throw new Error('Video element not ready');
    }

    try {
      await scannerRef.current.start(
        videoRef.current,
        handleScan,
        handleError
      );
      setIsScanning(true);
      setError(null);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to start scanning');
      setError(error);
      handleError(error);
      throw error;
    }
  }, [handleScan, handleError]);

  const stopScanning = useCallback(async () => {
    if (!scannerRef.current) return;

    try {
      await scannerRef.current.stop();
      setIsScanning(false);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to stop scanning');
      setError(error);
      throw error;
    }
  }, []);

  const switchCamera = useCallback(async (deviceId: string) => {
    if (!videoRef.current || !scannerRef.current) {
      throw new Error('Scanner not ready');
    }

    try {
      await scannerRef.current.switchCamera(
        deviceId,
        videoRef.current,
        handleScan,
        handleError
      );
      setSelectedCamera(deviceId);
      setError(null);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to switch camera');
      setError(error);
      throw error;
    }
  }, [handleScan, handleError]);

  const scanFile = useCallback(async (file: File): Promise<ScanResult> => {
    if (!scannerRef.current) {
      throw new Error('Scanner not initialized');
    }

    try {
      const result = await scannerRef.current.scanImage(file);
      setLastResult(result);
      setError(null);
      options.onScan?.(result);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to scan file');
      setError(error);
      throw error;
    }
  }, [options.onScan]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (options.autoStart && videoRef.current && !isScanning) {
      startScanning().catch(() => {});
    } else if (!options.autoStart && isScanning) {
      stopScanning().catch(() => {});
    }
  }, [options.autoStart]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
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
  };
}