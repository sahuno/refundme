import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY

interface ReceiptData {
  merchant_name: string
  total_amount: number
  date: string
  items: Array<{
    description: string
    amount: number
    category: string
  }>
  tax_amount?: number
  receipt_confidence: number
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!ANTHROPIC_API_KEY) {
      return NextResponse.json({ 
        error: 'OCR service not configured. Please add ANTHROPIC_API_KEY to environment variables.' 
      }, { status: 500 })
    }

    const formData = await req.formData()
    const file = formData.get('receipt') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No receipt image provided' }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Invalid file type. Please upload a JPEG, PNG, or WebP image.' 
      }, { status: 400 })
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ 
        error: 'File too large. Please upload an image smaller than 10MB.' 
      }, { status: 400 })
    }

    // Convert file to base64
    const bytes = await file.arrayBuffer()
    const base64 = Buffer.from(bytes).toString('base64')
    
    // Analyze receipt with Claude Vision API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: file.type,
                  data: base64
                }
              },
              {
                type: 'text',
                text: `Analyze this receipt image and extract the following information in JSON format:

{
  "merchant_name": "Name of the store/merchant",
  "total_amount": 0.00,
  "date": "YYYY-MM-DD",
  "items": [
    {
      "description": "Item description",
      "amount": 0.00,
      "category": "One of: Books & Educational Materials, Research Supplies & Equipment, Academic Software & Technology, Conference Fees & Academic Travel, Office Supplies for Academic Work, Food & Dining, Other"
    }
  ],
  "tax_amount": 0.00,
  "receipt_confidence": 85
}

Instructions:
- Extract the merchant/store name
- Parse the total amount (final amount paid)
- Convert date to YYYY-MM-DD format
- List individual items with descriptions and amounts
- Categorize items based on common graduate student expenses
- Include tax amount if visible
- Provide confidence score (0-100) for the extraction accuracy
- If text is unclear, make reasonable assumptions but lower confidence score
- Only return the JSON object, no additional text`
              }
            ]
          }
        ]
      })
    })

    if (!response.ok) {
      console.error('Claude API error:', response.status, await response.text())
      return NextResponse.json({ 
        error: 'Failed to analyze receipt. Please try again.' 
      }, { status: 500 })
    }

    const result = await response.json()
    const content = result.content?.[0]?.text

    if (!content) {
      return NextResponse.json({ 
        error: 'No content received from OCR analysis' 
      }, { status: 500 })
    }

    // Parse the JSON response from Claude
    let receiptData: ReceiptData
    try {
      // Clean the response to extract just the JSON
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('No JSON found in response')
      }
      receiptData = JSON.parse(jsonMatch[0])
    } catch {
      console.error('Failed to parse Claude response:', content)
      return NextResponse.json({ 
        error: 'Failed to parse receipt data. Please try with a clearer image.' 
      }, { status: 500 })
    }

    // Validate required fields
    if (!receiptData.merchant_name || !receiptData.total_amount || !receiptData.date) {
      return NextResponse.json({ 
        error: 'Could not extract essential receipt information. Please try with a clearer image.' 
      }, { status: 400 })
    }

    // Return the extracted data
    return NextResponse.json({
      success: true,
      data: receiptData,
      message: 'Receipt analyzed successfully'
    })

  } catch (error) {
    console.error('OCR analysis error:', error)
    return NextResponse.json({ 
      error: 'Internal server error during receipt analysis' 
    }, { status: 500 })
  }
}