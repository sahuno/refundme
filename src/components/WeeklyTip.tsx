import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Lightbulb } from 'lucide-react'

interface WeeklyTip {
  id: string
  content: string
  week_start: string
  created_at: string
}

export function WeeklyTip() {
  const [tip, setTip] = useState<WeeklyTip | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchWeeklyTip()
  }, [])

  const fetchWeeklyTip = async () => {
    try {
      const response = await fetch('/api/education/weekly-tip')
      const { data } = await response.json()
      
      if (data) {
        setTip(data)
      }
    } catch (error) {
      console.error('Error fetching weekly tip:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading || !tip) {
    return null
  }

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-blue-600" />
          Weekly Financial Tip
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-700">{tip.content}</p>
      </CardContent>
    </Card>
  )
}