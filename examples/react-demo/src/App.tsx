import React, { useState } from 'react'
import { BarcodeScanner } from '@coditoscannerito/react'
import type { ScanResult } from '@coditoscannerito/core'

function App() {
  const [scannedCode, setScannedCode] = useState<string>('')
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState<string>('')

  const handleScan = (result: ScanResult) => {
    console.log('Scanned code:', result)
    setScannedCode(result.text)
    setIsScanning(false)
    setError('')
  }

  const handleError = (error: Error) => {
    console.error('Scanner error:', error)
    setError(error.message)
    setIsScanning(false)
  }

  const handleClose = () => {
    setIsScanning(false)
  }

  const handleStart = () => {
    setError('')
    setScannedCode('')
    setIsScanning(true)
  }

  return (
    <div className="app">
      <header>
        <h1>Coditoscannerito Demo</h1>
        <p>Barcode scanner in React</p>
      </header>

      <main>
        <div className="start-section" style={{ display: isScanning ? 'none' : 'flex' }}>
          <button 
            onClick={handleStart}
            className="start-button"
          >
            Start scanner
          </button>
          
          {error && (
            <div className="error">
              <h2>Error:</h2>
              <p className="error-message">{error}</p>
              <button 
                onClick={() => setError('')}
                className="dismiss-button"
              >
                OK
              </button>
            </div>
          )}
          
          {scannedCode && (
            <div className="result">
              <h2>Scanned code:</h2>
              <p className="code">{scannedCode}</p>
            </div>
          )}
        </div>

        <div className="scanner-section" style={{ display: isScanning ? 'flex' : 'none' }}>
          <div className="scanner-wrapper">
            <BarcodeScanner
              onScan={handleScan}
              onError={handleError}
              showControls={false}
              autoStart={isScanning}
            />
            <div className="debug-overlay">
              <div>Scanning active...</div>
              <div style={{ fontSize: '0.8rem', marginTop: '5px', opacity: 0.8 }}>
                Point camera to barcode
              </div>
            </div>
            <button 
              onClick={handleClose}
              className="close-scanner-button"
            >
              Close scanner
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}

export default App
