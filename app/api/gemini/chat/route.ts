import { NextRequest, NextResponse } from 'next/server'
import { getGeminiClient } from '@/lib/gemini'

export async function POST(req: NextRequest) {
  try {
    const {
      messages,
      model = 'gemini-3.5-flash',
      useSearchGrounding = false,
      systemInstruction,
    } = await req.json()

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Messages array is required' }, { status: 400 })
    }

    const ai = getGeminiClient()

    // Determine target model
    let targetModel = model
    if (useSearchGrounding) {
      targetModel = 'gemini-3.5-flash'
    } else if (
      !['gemini-3.5-flash', 'gemini-3.1-flash-lite', 'gemini-3.1-pro-preview'].includes(model)
    ) {
      targetModel = 'gemini-3.5-flash'
    }

    const defaultSystemInstruction =
      systemInstruction ||
      'You are the GitFinder LT AI Code & Repository Advisor, an expert open-source guide and senior software architect. Help developers discover and explore GitHub repositories, compare developer tools and tech stacks, understand architecture patterns, and navigate repositories with clear, structured explanations.'

    // Format contents from history
    const contents = messages.map((m: { role: string; content: string }) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }],
    }))

    const config: Record<string, unknown> = {
      systemInstruction: defaultSystemInstruction,
    }

    if (useSearchGrounding) {
      config.tools = [{ googleSearch: {} }]
    }

    const response = await ai.models.generateContent({
      model: targetModel,
      contents,
      config,
    })

    const text = response.text || ''
    const groundingChunks =
      response.candidates?.[0]?.groundingMetadata?.groundingChunks || []

    const sources = groundingChunks
      .map((c: { web?: { uri?: string; title?: string } }) => c.web)
      .filter(Boolean)

    return NextResponse.json({
      text,
      sources,
      modelUsed: targetModel,
    })
  } catch (error) {
    console.error('Error generating chat response:', error)
    const errorMsg = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: errorMsg }, { status: 500 })
  }
}
