import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
// import { GoogleGenAI } from '@google/genai';

// Initialize Google Generative AI with your API key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
// gen
// Select the Gemini model you want to use
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' }); // Or "gemini-pro-vision" for multimodal

export async function POST(request: Request) {
  const { userText } = await request.json();

  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json(
      {
        error:
          'GEMINI_API_KEY environment variable not set. Cannot communicate with Gemini.',
      },
      { status: 500 }
    );
  }

  try {
    const result = await model.generateContent(userText);
    const response = await result.response;
    const aiMessage = response.candidates?.[0]?.content?.parts?.[0]?.text;
    // console.log('ad', response, aiMessage);

    return NextResponse.json({ message: aiMessage }, { status: 200 });
  } catch (error: Error) {
    console.error('Error communicating with Gemini:', error);
    return NextResponse.json(
      { error: 'Failed to get response from Gemini.' },
      { status: 500 }
    );
  }
}
