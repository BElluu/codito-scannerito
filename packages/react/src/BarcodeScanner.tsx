import React, { useState } from 'react';
import { useBarcodeScanner, UsBarcodeScannerOptions } from './useBarcodeScanner';
import type { ScanResult } from '@coditoscannerito/core';

export interface BarcodeScannerProps extends UsBarcodeScannerOptions {
  /**
   * Show overlay with target box
   */
  showOverlay?: boolean;
  
  /**
   * Show controls (start/stop, switch camera)
   */
  showControls?: boolean;
  
  /**
   * Text on start button
   */
  startButtonText?: string;
  
  /**
   * Text on stop button
   */
  stopButtonText?: string;
  
  /**
   * Width of target box (in percentage)
   */
  targetBoxWidth?: number;
  
  /**
   * Height of target box (in percentage)
   */
  targetBoxHeight?: number;
  
  /**
   * Custom class name
   */
  className?: string;
  
  /**
   * Show last scanned code
   */
  showLastResult?: boolean;
  
  /**
   * Sound when scanning
   */
  playSound?: boolean;
}

export const BarcodeScanner: React.FC<BarcodeScannerProps> = ({
  showOverlay = true,
  showControls = true,
  startButtonText = 'Start Scanning',
  stopButtonText = 'Stop Scanning',
  targetBoxWidth = 70,
  targetBoxHeight = 40,
  className = '',
  showLastResult = true,
  playSound = true,
  onScan,
  ...scannerOptions
}) => {
  const [scannedCode, setScannedCode] = useState<string>('');

  const handleScan = (result: ScanResult) => {
    setScannedCode(result.text);
    
    // Play sound
    if (playSound) {
      const beep = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZURE');
      beep.play().catch(() => {});
    }
    
    onScan?.(result);
  };

  const {
    videoRef,
    isScanning,
    lastResult,
    error,
    cameras,
    selectedCamera,
    startScanning,
    stopScanning,
    switchCamera
  } = useBarcodeScanner({
    ...scannerOptions,
    onScan: handleScan
  });

  return (
    <div className={`barcode-scanner ${className}`}>
      <div className="barcode-scanner__container">
        <video
          ref={videoRef}
          className="barcode-scanner__video"
          playsInline
        />
        
        {showOverlay && (
          <div className="barcode-scanner__overlay">
            <div 
              className="barcode-scanner__target-box"
              style={{
                width: `${targetBoxWidth}%`,
                height: `${targetBoxHeight}%`
              }}
            >
              <div className="barcode-scanner__corner barcode-scanner__corner--top-left" />
              <div className="barcode-scanner__corner barcode-scanner__corner--top-right" />
              <div className="barcode-scanner__corner barcode-scanner__corner--bottom-left" />
              <div className="barcode-scanner__corner barcode-scanner__corner--bottom-right" />
            </div>
            
            <div className="barcode-scanner__hint">
              {isScanning ? 'Align barcode within frame' : 'Press start to scan'}
            </div>
          </div>
        )}

        {showControls && (
          <div className="barcode-scanner__controls">
            <button
              className={`barcode-scanner__button ${isScanning ? 'barcode-scanner__button--stop' : 'barcode-scanner__button--start'}`}
              onClick={isScanning ? stopScanning : startScanning}
            >
              {isScanning ? stopButtonText : startButtonText}
            </button>

            {cameras.length > 1 && (
              <select
                className="barcode-scanner__camera-select"
                value={selectedCamera || ''}
                onChange={(e) => switchCamera(e.target.value)}
                disabled={!isScanning}
              >
                <option value="">Select Camera</option>
                {cameras.map(camera => (
                  <option key={camera.id} value={camera.id}>
                    {camera.label}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}

        {showLastResult && lastResult && (
          <div className="barcode-scanner__result">
            <div className="barcode-scanner__result-label">Last scan:</div>
            <div className="barcode-scanner__result-text">{scannedCode}</div>
            <div className="barcode-scanner__result-format">{lastResult.format}</div>
          </div>
        )}

        {error && (
          <div className="barcode-scanner__error">
            {error.message}
          </div>
        )}
      </div>
    </div>
  );
};