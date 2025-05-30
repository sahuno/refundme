'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function AIFeatureDemo() {
  return (
    <Card className="w-full max-w-2xl mx-auto bg-white border border-gray-200">
      <CardHeader>
        <CardTitle className="text-gray-900">RefundMe Features</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 bg-white">
        <div className="space-y-3">
          <h4 className="font-semibold text-gray-900">Features:</h4>
          <ul className="space-y-2 text-gray-700">
            <li className="flex items-start gap-2">
              <span className="text-green-600">✓</span>
              <span>Automatically finds eligible transactions</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600">✓</span>
              <span>Directly send request to designated payee</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600">✓</span>
              <span>Generate PDFs of request</span>
            </li>
          </ul>
        </div>

        <div className="space-y-3">
          <h4 className="font-semibold text-gray-900">Upcoming:</h4>
          <ul className="space-y-2 text-gray-600">
            <li className="flex items-start gap-2">
              <span className="text-blue-600">•</span>
              <span>iOS app</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600">•</span>
              <span>Attach tax forms & supporting documents</span>
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}