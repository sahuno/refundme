'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Toast } from '@/components/ui/toast'

interface ReceiptItem {
  description: string
  amount: number
  category: string
}

interface ReceiptData {
  merchant_name: string
  total_amount: number
  date: string
  items: ReceiptItem[]
  tax_amount?: number
  receipt_confidence: number
}

interface ReceiptUploadProps {
  onReceiptAnalyzed: (data: ReceiptData) => void
}

export function ReceiptUpload({ onReceiptAnalyzed }: ReceiptUploadProps) {
  const [analyzing, setAnalyzing] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [toast, setToast] = useState<{ open: boolean; title: string; description?: string }>({ 
    open: false, 
    title: '', 
    description: '' 
  })
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (file: File) => {
    if (!file) return

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      setToast({
        open: true,
        title: 'Invalid File Type',
        description: 'Please upload a JPEG, PNG, or WebP image.'
      })
      return
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setToast({
        open: true,
        title: 'File Too Large',
        description: 'Please upload an image smaller than 10MB.'
      })
      return
    }

    // Create preview
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)

    // Analyze receipt
    analyzeReceipt(file)
  }

  const analyzeReceipt = async (file: File) => {
    setAnalyzing(true)
    
    try {
      const formData = new FormData()
      formData.append('receipt', file)

      const response = await fetch('/api/ocr/analyze-receipt', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (result.success) {
        setToast({
          open: true,
          title: 'Receipt Analyzed Successfully!',
          description: `Extracted ${result.data.items.length} items with ${result.data.receipt_confidence}% confidence`
        })
        onReceiptAnalyzed(result.data)
      } else {
        setToast({
          open: true,
          title: 'Analysis Failed',
          description: result.error || 'Could not analyze receipt. Please try again.'
        })
      }
    } catch (error) {
      console.error('Receipt analysis error:', error)
      setToast({
        open: true,
        title: 'Upload Error',
        description: 'Network error occurred. Please try again.'
      })
    } finally {
      setAnalyzing(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const clearPreview = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <Card className="w-full bg-white border border-gray-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-gray-900">
          📄 Receipt Scanner
          <span className="text-sm font-normal text-gray-600">
            Powered by Claude Vision AI
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 bg-white">
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            dragOver
              ? 'border-blue-400 bg-blue-50'
              : analyzing
              ? 'border-yellow-400 bg-yellow-50'
              : 'border-gray-300 bg-gray-50 hover:border-gray-400'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          {previewUrl ? (
            <div className="space-y-4">
              <Image
                src={previewUrl}
                alt="Receipt preview"
                width={400}
                height={300}
                className="max-w-full max-h-48 mx-auto rounded-lg shadow-sm object-contain"
              />
              <div className="flex justify-center gap-2">
                <Button
                  variant="outline"
                  onClick={clearPreview}
                  disabled={analyzing}
                  className="bg-white text-gray-900 border-gray-300 hover:bg-gray-50"
                >
                  Clear
                </Button>
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={analyzing}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Upload Different Receipt
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {analyzing ? (
                <>
                  <div className="animate-spin text-4xl">🔍</div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Analyzing Receipt...</h3>
                    <p className="text-gray-600">
                      Using AI to extract expense information from your receipt
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-4xl">📷</div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Upload Receipt Image</h3>
                    <p className="text-gray-600">
                      Drag and drop a receipt image here, or click to browse
                    </p>
                    <p className="text-sm text-gray-500 mt-2">
                      Supports JPEG, PNG, WebP (max 10MB)
                    </p>
                  </div>
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={analyzing}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Choose File
                  </Button>
                </>
              )}
            </div>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          onChange={handleFileInput}
          className="hidden"
        />

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <span className="text-blue-600">💡</span>
            <div className="text-sm">
              <strong>Tips for better results:</strong>
              <ul className="mt-1 space-y-1 text-gray-700">
                <li>• Ensure receipt is clearly visible and well-lit</li>
                <li>• Avoid shadows or glare on the receipt</li>
                <li>• Include the entire receipt in the image</li>
                <li>• Use high resolution for small text</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>

      <Toast 
        open={toast.open} 
        onOpenChange={(open) => setToast(t => ({ ...t, open }))} 
        title={toast.title} 
        description={toast.description} 
      />
    </Card>
  )
}