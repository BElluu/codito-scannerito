import { useState, useRef } from 'react'
import { BarcodeScanner } from '@coditoscannerito/react'
import { BarcodeScanner as CoreScanner } from '@coditoscannerito/core'
import '@coditoscannerito/react/styles.css'
import type { ScanResult } from '@coditoscannerito/core'

function App() {
  const [showScanner, setShowScanner] = useState(false)
  const [lastResult, setLastResult] = useState<ScanResult | null>(null)
  const [isLoadingFile, setIsLoadingFile] = useState(false)
  const [error, setError] = useState<string>('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const scannerRef = useRef<CoreScanner | null>(null)

  if (!scannerRef.current) {
    scannerRef.current = new CoreScanner()
  }

  const handleScan = (result: ScanResult) => {
    console.log('Scanned:', result)
    setLastResult(result)
    setError('')
    setShowScanner(false)
  }

  const handleError = (err: Error) => {
    console.error('Scanner error:', err)
    setError(err.message)
  }

  const handleFileClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsLoadingFile(true)
    setError('')

    try {
      const result = await scannerRef.current!.scanImage(file)
      setLastResult(result)
    } catch (err) {
      setError('No barcode found in image')
    } finally {
      setIsLoadingFile(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  return (
    <div className="app">
      <header>
        <h1>Codito Scannerito</h1>
        <p>Barcode & QR Code Scanner</p>
      </header>

      <main>
        {!showScanner ? (
          <div className="start-section">
            <div className="buttons-row">
              <button 
                className="primary-btn"
                onClick={() => setShowScanner(true)}
              >
                📷 Open Scanner
              </button>
              
              <button 
                className="secondary-btn"
                onClick={handleFileClick}
                disabled={isLoadingFile}
              >
                {isLoadingFile ? '⏳ Processing...' : '📁 Scan from File'}
              </button>
            </div>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />

            {error && (
              <div className="error-box">
                <p>{error}</p>
                <button onClick={() => setError('')}>OK</button>
              </div>
            )}

            {lastResult && (
              <div className="result-details">
                <h3>✅ Last Scan</h3>
                <table>
                  <tbody>
                    <tr>
                      <td>Text:</td>
                      <td><code>{lastResult.text}</code></td>
                    </tr>
                    <tr>
                      <td>Format:</td>
                      <td>{lastResult.format}</td>
                    </tr>
                    <tr>
                      <td>Raw Text:</td>
                      <td><code>{lastResult.rawText}</code></td>
                    </tr>
                    <tr>
                      <td>Normalized:</td>
                      <td>{lastResult.wasNormalized ? 'Yes' : 'No'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          <div className="scanner-section">
            <BarcodeScanner
              onScan={handleScan}
              onError={handleError}
              showFileInput={false}
              showOverlay={true}
              showControls={true}
              showLastResult={false}
              playSound={true}
              autoStart={true}
            />
            <button 
              className="close-btn"
              onClick={() => setShowScanner(false)}
            >
              ✕ Close Scanner
            </button>
          </div>
        )}
      </main>
    </div>
  )
}

export default App
