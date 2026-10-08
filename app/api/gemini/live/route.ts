import { NextRequest, NextResponse } from 'next/server'
import { getGeminiClient } from '@/lib/gemini'

export async function POST(req: NextRequest) {
  try {
    const { message, audioData, mimeType = 'audio/webm', conversation = [] } = await req.json()

    if (!message && !audioData) {
      return NextResponse.json({ error: 'Message or audio data is required' }, { status: 400 })
    }

    const ai = getGeminiClient()

    const contents: Array<{
      role: 'user' | 'model'
      parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }>
    }> = conversation.map((c: { role: string; text: string }) => ({
      role: c.role === 'user' ? 'user' : 'model',
      parts: [{ text: c.text }],
    }))

    const currentParts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = []

    if (audioData) {
      const base64Audio = audioData.includes(',') ? audioData.split(',')[1] : audioData
      currentParts.push({
        inlineData: {
          mimeType,
          data: base64Audio,
        },
      })
    }

    if (message) {
      currentParts.push({ text: message })
    }

    contents.push({
      role: 'user',
      parts: currentParts,
    })

    // Query gemini-3.8-live
    let responseText = ''
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-live',
        contents,
        config: {
          systemInstruction:
            'You are a real-time voice assistant for GitFinder LT. Keep your responses concise, conversational, and direct (1-3 sentences) suitable for spoken voice interaction.',
        },
      })
      responseText = response.text || ''
    } catch (liveErr) {
      console.warn('Direct gemini-3.8-live call fallback:', liveErr)
      // If live direct call requires fallback, use gemini-3.5-flash
      const fallback = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents,
        config: {
          systemInstruction:
            'You are a voice assistant for GitFinder LT. Keep your responses concise, conversational, and direct (1-3 sentences).',
        },
      })
      responseText = fallback.text || ''
    }

    // Generate spoken audio using gemini-3.8-flash-lite-tts for voice playback
    let audioOutputBase64: string | null = null
    try {
      const ttsResponse = await ai.models.generateContent({
        model: 'gemini-3.8-flash-lite-tts',
        contents: [
          {
            role: 'user',
            parts: [{ text: responseText }],
          },
        ],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' },
            },
          },
        },
      })
      audioOutputBase64 =
        ttsResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null
    } catch (ttsErr) {
      console.warn('TTS generation notice:', ttsErr)
    }

    return NextResponse.json({
      text: responseText,
      audio: audioOutputBase64 ? `data:audio/wav;base64,${audioOutputBase64}` : null,
      modelUsed: 'gemini-3.8-live',
    })
  } catch (error) {
    console.error('Live conversation error:', error)
    const errorMsg = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: errorMsg }, { status: 500 })
  }
}
