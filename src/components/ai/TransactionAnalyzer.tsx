'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

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

interface TransactionAnalyzerProps {
  transactions: Transaction[]
  onEligibleSelected: (transactions: Transaction[]) => void
}

export function TransactionAnalyzer({ transactions, onEligibleSelected }: TransactionAnalyzerProps) {
  const [analyzing, setAnalyzing] = useState(false)
  const [eligibleTransactions, setEligibleTransactions] = useState<EligibleTransaction[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [showResults, setShowResults] = useState(false)

  const analyzeTransactions = async () => {
    setAnalyzing(true)
    try {
      const response = await fetch('/api/ai/analyze-transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transaction_ids: transactions.map(t => t.id)
        })
      })

      if (!response.ok) {
        throw new Error('Failed to analyze transactions')
      }

      const data = await response.json()
      setEligibleTransactions(data.eligible_transactions)
      setShowResults(true)

      // Auto-select high confidence transactions
      const highConfidenceIds = data.eligible_transactions
        .filter((t: EligibleTransaction) => t.confidence_score >= 80)
        .map((t: EligibleTransaction) => t.id)
      setSelectedIds(new Set(highConfidenceIds))

    } catch (error) {
      console.error('Analysis failed:', error)
    } finally {
      setAnalyzing(false)
    }
  }

  const toggleSelection = (transactionId: string) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(transactionId)) {
      newSelected.delete(transactionId)
    } else {
      newSelected.add(transactionId)
    }
    setSelectedIds(newSelected)
  }

  const handleSelectEligible = () => {
    const selectedTransactions = eligibleTransactions.filter(t => selectedIds.has(t.id))
    onEligibleSelected(selectedTransactions)
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600'
    if (confidence >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 80) return 'High'
    if (confidence >= 60) return 'Medium'
    return 'Low'
  }

  return (
    <Card className="w-full bg-white border border-gray-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-gray-900">
          🤖 AI Transaction Analyzer
          <span className="text-sm font-normal text-gray-600">
            Powered by Claude AI
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 bg-white">
        {!showResults ? (
          <div className="text-center space-y-4">
            <p className="text-gray-600">
              Use AI to automatically identify eligible transactions for reimbursement.
              The AI will analyze transaction descriptions, merchants, and categories to determine eligibility.
            </p>
            <Button 
              onClick={analyzeTransactions} 
              disabled={analyzing || transactions.length === 0}
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white"
            >
              {analyzing ? (
                <>
                  <span className="animate-spin mr-2">⚡</span>
                  Analyzing {transactions.length} transactions...
                </>
              ) : (
                <>
                  ✨ Analyze {transactions.length} Transactions
                </>
              )}
            </Button>
            
            {analyzing && (
              <div className="mt-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                  <span>Processing with AI... This may take 10-15 seconds</span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-gray-900">
                Found {eligibleTransactions.length} eligible transactions
              </h3>
              <Button
                onClick={() => setShowResults(false)}
                variant="outline"
                size="sm"
                className="bg-white text-gray-900 border-gray-300 hover:bg-gray-50"
              >
                Analyze Again
              </Button>
            </div>

            {eligibleTransactions.length === 0 ? (
              <p className="text-gray-600 text-center py-4">
                No eligible transactions found. Try adjusting your transaction selection or add manual items.
              </p>
            ) : (
              <>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {eligibleTransactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedIds.has(transaction.id)
                          ? 'bg-blue-50 border-blue-300'
                          : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                      }`}
                      onClick={() => toggleSelection(transaction.id)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={selectedIds.has(transaction.id)}
                              onChange={() => toggleSelection(transaction.id)}
                              className="rounded"
                            />
                            <span className="font-medium text-gray-900">{transaction.description}</span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {transaction.merchant_name ? `${transaction.merchant_name} • ` : ''}
                            ${Math.abs(transaction.amount).toFixed(2)} • {transaction.date}
                          </p>
                          <p className="text-sm text-blue-600 mt-1">
                            {transaction.eligibility_reason}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className={`text-sm font-medium ${getConfidenceColor(transaction.confidence_score)}`}>
                            {getConfidenceLabel(transaction.confidence_score)}
                          </span>
                          <div className="text-xs text-gray-500">
                            {transaction.confidence_score}% confidence
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center pt-3 border-t">
                  <div className="text-sm text-gray-600">
                    {selectedIds.size} of {eligibleTransactions.length} selected
                  </div>
                  <Button
                    onClick={handleSelectEligible}
                    disabled={selectedIds.size === 0}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    Add {selectedIds.size} Transactions to Request
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}