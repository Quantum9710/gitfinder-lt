import { NextRequest, NextResponse } from 'next/server'
import { getGeminiClient } from '@/lib/gemini'

export async function POST(req: NextRequest) {
  try {
    const { audioData, mimeType = 'audio/webm' } = await req.json()

    if (!audioData) {
      return NextResponse.json({ error: 'Audio data is required' }, { status: 400 })
    }

    const ai = getGeminiClient()

    // Clean base64 data if it contains a data URL prefix
    const base64AudioString = audioData.includes(',')
      ? audioData.split(',')[1]
      : audioData

    const audioPart = {
      inlineData: {
        mimeType,
        data: base64AudioString,
      },
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-transcribe',
      contents: {
        parts: [
          audioPart,
          {
            text: 'Transcribe this voice audio accurately into plain text. Only return the transcribed words without commentary or formatting.',
          },
        ],
      },
    })

    const transcription = response.text?.trim() || ''

    return NextResponse.json({
      transcription,
      modelUsed: 'gemini-3.5-transcribe',
    })
  } catch (error) {
    console.error('Transcription error:', error)
    const errorMsg = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: errorMsg }, { status: 500 })
  }
}
