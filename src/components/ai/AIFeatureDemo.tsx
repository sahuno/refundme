'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function AIFeatureDemo() {
  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🤖 AI-Powered Transaction Analysis
          <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
            New Feature
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-gray-600">
          RefundMe now uses Claude AI to automatically identify eligible expenses for graduate student reimbursements.
        </div>
        
        <div className="space-y-3">
          <h4 className="font-semibold text-gray-900">How it works:</h4>
          <div className="space-y-2">
            <div className="flex items-start gap-3">
              <span className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">1</span>
              <p className="text-sm">Connect your bank account to sync transactions automatically</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">2</span>
              <p className="text-sm">Click &ldquo;🤖 AI Analysis&rdquo; to analyze your transactions</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">3</span>
              <p className="text-sm">Review AI suggestions with confidence scores</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">4</span>
              <p className="text-sm">Select eligible transactions and submit for reimbursement</p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="font-semibold text-gray-900">Eligible Categories:</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-green-600">📚</span>
              <span>Books & Educational Materials</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-blue-600">🔬</span>
              <span>Research Supplies & Equipment</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-purple-600">💻</span>
              <span>Academic Software & Technology</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-orange-600">✈️</span>
              <span>Conference Fees & Academic Travel</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-600">📝</span>
              <span>Office Supplies for Academic Work</span>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <span className="text-yellow-600">💡</span>
            <div className="text-sm">
              <strong>Tip:</strong> The AI works even without an API key using intelligent rules. 
              For enhanced accuracy, add your Anthropic API key to environment variables.
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}