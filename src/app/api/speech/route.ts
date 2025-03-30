import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get('content-type') || '';
    
    // Handle transcription request (FormData)
    if (contentType.includes('multipart/form-data')) {
      try {
        const formData = await request.formData();
        const file = formData.get('file') as File;
        
        if (!file) {
          return NextResponse.json(
            { error: 'No audio file provided' },
            { status: 400 }
          );
        }

        const transcription = await openai.audio.transcriptions.create({
          file,
          model: 'whisper-1',
        });

        return NextResponse.json({ text: transcription.text });
      } catch (error: any) {
        console.error('OpenAI Transcription Error:', error);
        return NextResponse.json(
          { error: error.message || 'Failed to transcribe audio' },
          { status: 500 }
        );
      }
    }
    
    // Handle text-to-speech request (JSON)
    if (contentType.includes('application/json')) {
      try {
        const { text } = await request.json();
        
        if (!text) {
          return NextResponse.json(
            { error: 'No text provided' },
            { status: 400 }
          );
        }

        const response = await openai.audio.speech.create({
          model: 'tts-1',
          voice: 'alloy',
          input: text,
        });

        const audioBlob = await response.blob();
        
        return new NextResponse(audioBlob, {
          headers: {
            'Content-Type': 'audio/mpeg',
          },
        });
      } catch (error: any) {
        console.error('OpenAI Speech Error:', error);
        return NextResponse.json(
          { error: error.message || 'Failed to generate speech' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Invalid content type' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Speech API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process speech request' },
      { status: 500 }
    );
  }
}