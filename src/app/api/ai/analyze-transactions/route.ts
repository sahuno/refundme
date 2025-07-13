import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface Transaction {
  id: string
  description: string
  merchant_name: string | null
  category: string | null
  amount: number
  date: string
}

interface EligibleTransaction extends Transaction {
  eligibility_reason: string
  confidence_score: number
}

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY


async function analyzeBatchWithAI(transactions: Transaction[]): Promise<Array<{ eligible: boolean; reason: string; confidence: number }>> {
  if (!ANTHROPIC_API_KEY) {
    // Fallback to rule-based analysis if no API key
    return transactions.map(analyzeTransactionRuleBased)
  }

  try {
    // Create batch prompt for multiple transactions
    const transactionList = transactions.map((t, i) => 
      `${i + 1}. Description: ${t.description}, Merchant: ${t.merchant_name ?? 'Unknown'}, Category: ${t.category ?? 'Unknown'}, Amount: $${Math.abs(t.amount)}`
    ).join('\n')

    const prompt = `
Analyze these ${transactions.length} financial transactions for graduate student reimbursement eligibility.

Transactions:
${transactionList}

Eligible categories:
- Books & Educational Materials
- Research Supplies & Equipment  
- Academic Software & Technology
- Conference Fees & Academic Travel
- Office Supplies for Academic Work

Respond with a JSON array with one object per transaction:
[
  {
    "eligible": boolean,
    "reason": "Brief explanation",
    "confidence": number (0-100)
  }
]
`

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })
    })

    if (!response.ok) {
      throw new Error('AI API request failed')
    }

    const data = await response.json()
    const content = data.content[0].text
    
    // Extract JSON array from response
    const jsonMatch = content.match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      throw new Error('No JSON array found in response')
    }
    
    const analyses = JSON.parse(jsonMatch[0])
    
    // Ensure we have the right number of results
    if (analyses.length !== transactions.length) {
      throw new Error('Mismatch in analysis results count')
    }
    
    return analyses
  } catch (error) {
    console.error('Batch AI analysis failed:', error)
    // Fallback to rule-based analysis for all
    return transactions.map(analyzeTransactionRuleBased)
  }
}

function analyzeTransactionRuleBased(transaction: Transaction): { eligible: boolean; reason: string; confidence: number } {
  const description = transaction.description.toLowerCase()
  const merchant = (transaction.merchant_name ?? '').toLowerCase()
  const category = (transaction.category ?? '').toLowerCase()
  
  // Educational keywords
  const educationalKeywords = [
    'book', 'textbook', 'amazon', 'barnes', 'noble', 'education', 'academic',
    'university', 'college', 'research', 'lab', 'laboratory', 'software',
    'microsoft', 'adobe', 'conference', 'ieee', 'acm', 'journal', 'library',
    'staples', 'office', 'depot', 'notebook', 'printer', 'paper'
  ]

  // Check for educational keywords
  const hasEducationalKeyword = educationalKeywords.some(keyword => 
    description.includes(keyword) || merchant.includes(keyword)
  )

  // Check categories
  const eligibleCategories = ['education', 'books', 'office', 'software', 'professional']
  const hasEligibleCategory = eligibleCategories.some(cat => category.includes(cat))

  // Amount threshold (typically smaller amounts are more likely to be supplies)
  const amount = Math.abs(transaction.amount)
  const reasonableAmount = amount <= 500

  if (hasEducationalKeyword && reasonableAmount) {
    return {
      eligible: true,
      reason: 'Contains educational keywords and reasonable amount',
      confidence: hasEligibleCategory ? 85 : 70
    }
  }

  if (hasEligibleCategory && reasonableAmount) {
    return {
      eligible: true,
      reason: 'Transaction category indicates educational expense',
      confidence: 75
    }
  }

  return {
    eligible: false,
    reason: 'Does not match typical educational expense patterns',
    confidence: 60
  }
}

export async function POST(req: Request) {
  try {
    const supabase = createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { transaction_ids } = await req.json()

    if (!transaction_ids || !Array.isArray(transaction_ids)) {
      return NextResponse.json({ error: 'Invalid transaction IDs' }, { status: 400 })
    }

    // Fetch transactions
    const { data: transactions, error: fetchError } = await supabase
      .from('transactions')
      .select('*')
      .in('id', transaction_ids)
      .eq('user_id', user.id)

    if (fetchError) {
      return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 })
    }

    // Analyze all transactions in batch for better performance
    const analyses = await analyzeBatchWithAI(transactions)
    
    const eligibleTransactions: EligibleTransaction[] = []
    
    transactions.forEach((transaction, index) => {
      const analysis = analyses[index]
      
      if (analysis.eligible) {
        eligibleTransactions.push({
          ...transaction,
          eligibility_reason: analysis.reason,
          confidence_score: analysis.confidence
        })
      }
    })

    return NextResponse.json({
      eligible_transactions: eligibleTransactions,
      total_analyzed: transactions.length,
      total_eligible: eligibleTransactions.length
    })

  } catch (error) {
    console.error('AI analysis error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}