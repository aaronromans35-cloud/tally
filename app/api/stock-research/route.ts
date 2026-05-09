import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

export async function POST(req: NextRequest) {
  const { ticker, name, price, change, changePct, high52, low52, marketCap, volume, history } = await req.json()

  const historyStr = history?.slice(-30).map((h: { date: string; price: number }) =>
    `${h.date}: $${h.price}`
  ).join(', ') ?? 'No history available'

  const prompt = `You are a financial educator helping a high school student understand a stock. Be clear, simple, and educational — avoid jargon. Keep it under 200 words.

Stock: ${name} (${ticker})
Current Price: $${price} (${change >= 0 ? '+' : ''}${change}, ${changePct}% today)
52-Week Range: $${low52} – $${high52}
Market Cap: ${marketCap ? `$${(marketCap / 1e9).toFixed(1)}B` : 'N/A'}
Volume: ${volume ? volume.toLocaleString() : 'N/A'}
Recent price history (last 30 days): ${historyStr}

Give a plain-English analysis covering:
1. What this company does (1-2 sentences)
2. How the stock has been performing recently
3. Key things a young investor should know about this stock
4. One risk and one opportunity

Keep it educational and balanced — don't recommend buying or selling.`

  const message = await client.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 400,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : ''
  return NextResponse.json({ analysis: text })
}
