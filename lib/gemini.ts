import { GoogleGenAI } from '@google/genai'

export function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY
  return new GoogleGenAI({
    apiKey: apiKey || '',
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  })
}
