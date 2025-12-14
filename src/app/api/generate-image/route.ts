import { NextRequest, NextResponse } from "next/server";
import ZAI from 'z-ai-web-dev-sdk';
import { uploadImageData } from '@/lib/imagekit';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt } = body;

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    const zai = await ZAI.create();
    
    const response = await zai.images.generations.create({
      prompt: prompt,
      size: '1024x1024'
    });

    const imageBase64 = response.data[0]?.base64;
    
    if (!imageBase64) {
      throw new Error('No image generated');
    }

    // Convert base64 to a data URL
    const dataUrl = `data:image/png;base64,${imageBase64}`;

    // Upload generated image to CDN and return hosted URL
    try {
      const hostedUrl = await uploadImageData(dataUrl, 'ai-generated');
      return NextResponse.json({ imageUrl: hostedUrl });
    } catch (uploadErr) {
      console.error('Failed to upload generated image:', uploadErr);
      // Fall back to returning the data URL if upload fails
      return NextResponse.json({ imageUrl: dataUrl });
    }
  } catch (error) {
    console.error("Image generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate image" },
      { status: 500 }
    );
  }
}