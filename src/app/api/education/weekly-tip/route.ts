import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()

  try {
    // Get the current week's start date (Monday)
    const today = new Date()
    const dayOfWeek = today.getDay()
    const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)
    const weekStart = new Date(today.setDate(diff))
    weekStart.setHours(0, 0, 0, 0)

    // Fetch the weekly tip for the current week
    const { data, error } = await supabase
      .from('weekly_tips')
      .select('*')
      .eq('week_start', weekStart.toISOString().split('T')[0])
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch weekly tip' },
      { status: 500 }
    )
  }
}