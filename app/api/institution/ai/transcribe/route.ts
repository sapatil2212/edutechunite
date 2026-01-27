import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// Get OpenAI API key
const getOpenAIKey = () => {
  const key = process.env.OPENAI_API_KEY || ''
  return key.replace(/['"]+/g, '').trim()
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    const audioFile = formData.get('audio') as File

    if (!audioFile) {
      return NextResponse.json(
        { success: false, message: 'No audio file provided' },
        { status: 400 }
      )
    }

    const apiKey = getOpenAIKey()
    if (!apiKey) {
      return NextResponse.json(
        { success: false, message: 'OpenAI API key not configured' },
        { status: 500 }
      )
    }

    // Create form data for OpenAI
    const openAIFormData = new FormData()
    openAIFormData.append('file', audioFile, 'audio.webm')
    openAIFormData.append('model', 'whisper-1')
    openAIFormData.append('language', 'en')
    openAIFormData.append('response_format', 'json')

    // Send to OpenAI Whisper API
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
      body: openAIFormData,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Whisper API error:', errorData);
      
      const errorCode = errorData?.error?.code;
      let errorMessage = 'Failed to transcribe audio';
      
      if (errorCode === 'insufficient_quota') {
        errorMessage = 'AI Transcription quota exceeded. Please check your OpenAI billing details.';
      } else if (errorCode === 'invalid_api_key') {
        errorMessage = 'Invalid OpenAI API key configuration.';
      }

      return NextResponse.json(
        { success: false, message: errorMessage },
        { status: response.status === 429 ? 429 : 500 }
      )
    }

    const data = await response.json()
    const transcript = data.text?.trim() || ''

    console.log('🎤 Transcribed:', transcript)

    return NextResponse.json({
      success: true,
      transcript,
    })
  } catch (error) {
    console.error('Transcription error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to process audio' },
      { status: 500 }
    )
  }
}
