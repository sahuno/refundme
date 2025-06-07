import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  
  // Verify authentication
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const { transaction_ids } = await request.json();
  
  try {
    // Get transactions
    const { data: transactions, error } = await supabase
      .from('transactions')
      .select('*')
      .in('id', transaction_ids);
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    
    // Use existing AI analysis logic
    const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
    if (!ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: 'AI service not configured' }, { status: 500 });
    }
    
    // Filter unanalyzed transactions
    const unanalyzedTransactions = transactions.filter(t => !t.ai_analysis);
    
    if (unanalyzedTransactions.length === 0) {
      return NextResponse.json({ transactions });
    }
    
    // Batch analysis
    const transactionList = unanalyzedTransactions.map((t, i) => 
      `${i + 1}. Description: ${t.description}, Merchant: ${t.merchant_name ?? 'Unknown'}, Amount: $${t.amount}, Date: ${t.date}`
    ).join('\n');
    
    const prompt = `You are an AI assistant helping to analyze bank transactions for academic reimbursement eligibility.

For each transaction, determine if it's eligible for academic reimbursement and provide a confidence score (0.0-1.0).

Academic expenses typically include:
- Books and educational materials
- Research supplies and equipment
- Academic software and technology
- Conference fees and academic travel
- Office supplies for academic work

Return a JSON array with this exact structure for each transaction:
[
  {
    "transaction_number": 1,
    "eligible": true/false,
    "confidence": 0.0-1.0,
    "reason": "Brief explanation",
    "category": "Suggested category"
  }
]

Transactions to analyze:
${transactionList}`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 2048,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })
    });
    
    if (!response.ok) {
      throw new Error('AI analysis failed');
    }
    
    const aiResponse = await response.json();
    const analysisText = aiResponse.content[0].text;
    
    // Parse AI response
    let analysis;
    try {
      const jsonMatch = analysisText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      return NextResponse.json({ error: 'Failed to parse AI analysis' }, { status: 500 });
    }
    
    // Update transactions with analysis
    const updates = [];
    for (let i = 0; i < unanalyzedTransactions.length; i++) {
      const transaction = unanalyzedTransactions[i];
      const result = analysis[i];
      
      if (result) {
        const aiAnalysis = {
          eligible: result.eligible,
          confidence: result.confidence,
          reason: result.reason,
          category: result.category
        };
        
        updates.push(
          supabase
            .from('transactions')
            .update({ 
              ai_analysis: aiAnalysis,
              is_eligible: result.eligible 
            })
            .eq('id', transaction.id)
        );
        
        // Update local transaction object
        transaction.ai_analysis = aiAnalysis;
        transaction.is_eligible = result.eligible;
      }
    }
    
    // Execute all updates
    await Promise.all(updates);
    
    return NextResponse.json({ transactions });
  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { error: 'Analysis failed' },
      { status: 500 }
    );
  }
}