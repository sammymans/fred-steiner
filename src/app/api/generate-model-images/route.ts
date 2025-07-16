import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function encodeImage(buffer: Buffer): string {
  return buffer.toString('base64');
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('images') as File[];
    
    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No images provided' }, { status: 400 });
    }

    const results = [];

    for (const file of files) {
      try {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const base64Image = encodeImage(buffer);

        const prompt = `Generate a photorealistic image of the clothing item from the reference picture 
        being worn by a model on a clean white background. The model should be posed naturally 
        and the lighting should be professional and even, similar to an e-commerce product photo.`;

        const response = await openai.responses.create({
          model: "gpt-4.1",
          input: [
            {
              role: "user",
              content: [
                { type: "input_text", text: prompt },
                {
                  type: "input_image",
                  image_url: `data:image/jpeg;base64,${base64Image}`,
                  detail: "high" as const,
                },
              ],
            },
          ],
          tools: [{ type: "image_generation" }],
        });

        const imageGenerationCalls = response.output.filter(
          (output) => output.type === "image_generation_call"
        );

        if (imageGenerationCalls.length > 0) {
          const imageData = imageGenerationCalls[0].result;
          results.push({
            originalName: file.name,
            success: true,
            imageData,
          });
        } else {
          results.push({
            originalName: file.name,
            success: false,
            error: 'No image generated',
          });
        }
              } catch (error) {
          results.push({
            originalName: file.name,
            success: false,
            error: `Error processing ${file.name}: ${error instanceof Error ? error.message : String(error)}`,
          });
        }
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Error in generate-model-images API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 