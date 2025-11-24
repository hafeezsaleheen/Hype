import { GoogleGenAI, Modality, Type } from "@google/genai";
import { fileToBase64, getMimeType } from '../utils/fileUtils';
import { GeneratedImage } from "../types";

const imageModel = 'gemini-3-pro-image-preview';
const recommendationModel = 'gemini-3-pro-preview';
const captionModel = 'gemini-3-pro-preview';
const textModel = 'gemini-3-pro-preview';

// Helper to get AI instance with current key
const getAi = () => {
    const API_KEY = process.env.API_KEY;
    if (!API_KEY) {
        throw new Error("API_KEY environment variable not set");
    }
    return new GoogleGenAI({ apiKey: API_KEY });
};

async function extractImageFromResponse(response: any): Promise<string> {
    // Iterate through candidates and parts to find the image
    const candidate = response.candidates?.[0];
    if (candidate?.content?.parts) {
        for (const part of candidate.content.parts) {
            if (part.inlineData) {
                const base64ImageBytes: string = part.inlineData.data;
                return `data:${part.inlineData.mimeType};base64,${base64ImageBytes}`;
            }
        }
    }
    throw new Error("errors.apiNoImage");
}

const applyNegativePrompt = (prompt: string, negativePrompt?: string): string => {
    if (negativePrompt && negativePrompt.trim() !== '') {
        return `${prompt}\n\nNegative prompt: please avoid generating the following elements: ${negativePrompt}.`;
    }
    return prompt;
};

export async function removeBackground(file: File): Promise<File> {
  const ai = getAi();
  const imageBase64 = await fileToBase64(file);
  const mimeType = getMimeType(file);

  const imagePart = {
    inlineData: { data: imageBase64, mimeType: mimeType },
  };
  const textPart = {
    text: "Perfectly segment the main product from the original image. Make the background fully transparent (alpha channel). Do not add any shadows.",
  };

  const response = await ai.models.generateContent({
    model: imageModel,
    contents: { parts: [imagePart, textPart] },
    config: {
      responseModalities: [Modality.IMAGE],
    },
  });

  const src = await extractImageFromResponse(response);
  const blob = await fetch(src).then(res => res.blob());
  return new File([blob], "isolated-product.png", { type: "image/png" });
}

export async function enhanceImage(file: File): Promise<File> {
    const ai = getAi();
    const imageBase64 = await fileToBase64(file);
    const mimeType = getMimeType(file);

    const imagePart = {
        inlineData: { data: imageBase64, mimeType: mimeType },
    };
    const textPart = {
        text: "You are a professional photo editor. Enhance this product photograph for an e-commerce website. Subtly improve the lighting, color balance, and sharpness to make the product look its best. Keep the result realistic and do not add, remove, or change any elements or the background. Return only the enhanced image.",
    };

    const response = await ai.models.generateContent({
        model: imageModel,
        contents: { parts: [imagePart, textPart] },
        config: {
            responseModalities: [Modality.IMAGE],
        },
    });

    const src = await extractImageFromResponse(response);
    const blob = await fetch(src).then(res => res.blob());
    return new File([blob], "enhanced-product.png", { type: "image/png" });
}

export async function categorizeProduct(file: File): Promise<string> {
    const ai = getAi();
    const imageBase64 = await fileToBase64(file);
    const mimeType = getMimeType(file);
    const imagePart = {
        inlineData: { data: imageBase64, mimeType: mimeType },
    };
    const textPart = {
        text: "Analyze the product in this image. Identify its primary category. Examples: 'Fashion', 'Food', 'Skincare', 'Electronics', 'Home Goods'. Respond with only the category name.",
    };

    const response = await ai.models.generateContent({
        model: recommendationModel,
        contents: { parts: [imagePart, textPart] },
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    category: {
                        type: Type.STRING,
                        description: "The primary category of the product."
                    }
                },
                required: ['category']
            },
        },
    });

    const jsonResponse = JSON.parse(response.text || '{}');
    if (jsonResponse.category) {
        return jsonResponse.category;
    }
    throw new Error("Failed to categorize product.");
}


export async function enhancePrompt(currentPrompt: string, productContext: string): Promise<string> {
    const ai = getAi();
    const prompt = `You are a world-class photography prompt engineer for an image generation AI. Your task is to take a user's simple idea and a product context, then rewrite it into a highly detailed and effective prompt.

**Instructions:**
1.  Retain the user's core idea.
2.  Incorporate the product context seamlessly.
3.  Add rich, descriptive details about:
    -   **Lighting:** (e.g., soft morning light, dramatic cinematic lighting, golden hour glow)
    -   **Composition:** (e.g., minimalist, rule of thirds, dynamic angle, flat lay)
    -   **Mood & Atmosphere:** (e.g., serene and calming, energetic and vibrant, luxurious and sophisticated)
    -   **Style:** (e.g., photorealistic, cinematic, high-fashion editorial)
4.  The final prompt should be a single, coherent paragraph.

**Product Context:** "${productContext}"
**User's Draft Prompt:** "${currentPrompt}"

Rewrite the prompt now.`;

    const response = await ai.models.generateContent({
        model: textModel,
        contents: prompt,
    });

    return response.text?.trim() || currentPrompt;
}


export async function generateCaptions(
  productDescription: string,
  styleName: string
): Promise<string[]> {
  const ai = getAi();
  const prompt = `You are a savvy e-commerce marketing expert. Write 3 compelling and short social media captions for the following product.
Product: "${productDescription}"
Photo Style: "${styleName}"
Rules:
- Keep them short and punchy.
- Use relevant emojis.
- End with a call to action.`;

  const response = await ai.models.generateContent({
    model: captionModel,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          captions: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "An array of 3 unique social media captions."
          }
        },
        required: ['captions']
      },
    },
  });

  const jsonResponse = JSON.parse(response.text || '{}');
  if (jsonResponse.captions && Array.isArray(jsonResponse.captions)) {
    return jsonResponse.captions;
  }
  throw new Error("Failed to generate captions.");
}


export async function recommendStyles(
  file: File | null,
  description: string,
  styleList: {id: string, name: string}[]
): Promise<string[]> {
  const ai = getAi();
  const parts: any[] = [];
  
  if (file) {
    const imageBase64 = await fileToBase64(file);
    const mimeType = getMimeType(file);
    parts.push({
      inlineData: { data: imageBase64, mimeType: mimeType },
    });
  }
  
  const instructions = `You are an expert art director for product photography. Your task is to recommend the 3 most suitable photography styles for a given product.

**Instructions:**
1.  Analyze the provided product (from the image or text description).
2.  Identify the product's category (e.g., beverage, food, fashion, cosmetics, electronics).
3.  From the list of available styles below, choose the 3 most suitable and commercially viable options.
4.  **Heavily prioritize specialized styles that match the product's category.**
5.  Return only the unique IDs of your top 3 choices. Do not repeat IDs.

**Available Styles (with Name and ID):**
${JSON.stringify(styleList, null, 2)}
`;

  let fullPromptText = '';
  if (description) {
      fullPromptText += `The product is: "${description}"\n\n`;
  }
  fullPromptText += instructions;
  parts.push({text: fullPromptText});

  const response = await ai.models.generateContent({
    model: recommendationModel,
    contents: { parts: parts },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          recommendations: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "An array of the three most suitable style IDs from the provided list."
          }
        },
        required: ['recommendations']
      },
    },
  });

  const jsonResponse = JSON.parse(response.text || '{}');
  if (jsonResponse.recommendations && Array.isArray(jsonResponse.recommendations)) {
    return jsonResponse.recommendations.slice(0, 3);
  }
  return []; // Fail gracefully
}

// Single Image Generators
export async function generateSingleImageWithFile(file: File, prompt: string, negativePrompt?: string): Promise<GeneratedImage> {
    const ai = getAi();
    const imageBase64 = await fileToBase64(file);
    const mimeType = getMimeType(file);

    const imagePart = {
        inlineData: {
            data: imageBase64,
            mimeType: mimeType,
        },
    };
    const textPart = {
        text: applyNegativePrompt(prompt, negativePrompt),
    };

    const response = await ai.models.generateContent({
        model: imageModel,
        contents: {
            parts: [imagePart, textPart],
        },
        config: {
            responseModalities: [Modality.IMAGE],
        },
    });

    const src = await extractImageFromResponse(response);
    return { src, prompt };
}

export async function generateSingleImageFromText(prompt: string, negativePrompt?: string): Promise<GeneratedImage> {
    const ai = getAi();
    const textPart = { text: applyNegativePrompt(prompt, negativePrompt) };

    const response = await ai.models.generateContent({
        model: imageModel,
        contents: {
            parts: [textPart],
        },
        config: {
            responseModalities: [Modality.IMAGE],
        },
    });

    const src = await extractImageFromResponse(response);
    return { src, prompt };
}

export async function generateSingleImageWithReference(productFile: File, referenceFile: File, prompt: string, negativePrompt?: string): Promise<GeneratedImage> {
    const ai = getAi();
    const productBase64 = await fileToBase64(productFile);
    const productMimeType = getMimeType(productFile);
    const referenceBase64 = await fileToBase64(referenceFile);
    const referenceMimeType = getMimeType(referenceFile);

    const productPart = { inlineData: { data: productBase64, mimeType: productMimeType } };
    const referencePart = { inlineData: { data: referenceBase64, mimeType: referenceMimeType } };
    const textPart = { text: applyNegativePrompt(prompt, negativePrompt) };

    const response = await ai.models.generateContent({
        model: imageModel,
        contents: { parts: [productPart, referencePart, textPart] },
        config: { responseModalities: [Modality.IMAGE] },
    });
    const src = await extractImageFromResponse(response);
    return { src, prompt };
}

export async function generateSingleImageFromTextWithReference(productDescription: string, referenceFile: File, prompt: string, negativePrompt?: string): Promise<GeneratedImage> {
    const ai = getAi();
    const referenceBase64 = await fileToBase64(referenceFile);
    const referenceMimeType = getMimeType(referenceFile);

    const referencePart = { inlineData: { data: referenceBase64, mimeType: referenceMimeType } };
    const textPart = { text: `${applyNegativePrompt(prompt, negativePrompt)}\n\nProduct Context: ${productDescription}` };

    const response = await ai.models.generateContent({
        model: imageModel,
        contents: { parts: [referencePart, textPart] },
        config: { responseModalities: [Modality.IMAGE] },
    });
    const src = await extractImageFromResponse(response);
    return { src, prompt };
}

export async function generateMockup(file: File, prompt: string): Promise<GeneratedImage> {
    const ai = getAi();
    const imageBase64 = await fileToBase64(file);
    const mimeType = getMimeType(file);

    const imagePart = {
        inlineData: {
            data: imageBase64,
            mimeType: mimeType,
        },
    };
    const textPart = {
        text: `Create a realistic product mockup. ${prompt} The product provided in the image must be the main subject, integrated naturally into the scene.`,
    };

    const response = await ai.models.generateContent({
        model: imageModel,
        contents: {
            parts: [imagePart, textPart],
        },
        config: {
            responseModalities: [Modality.IMAGE],
        },
    });

    const src = await extractImageFromResponse(response);
    return { src, prompt };
}

// Multi-Image Batch Generators (returning arrays of promises)
export function generateProductImages(file: File, prompt: string, negativePrompt?: string): Promise<GeneratedImage>[] {
    return Array(4).fill(null).map(() => generateSingleImageWithFile(file, prompt, negativePrompt));
}

export function generateProductImagesFromText(description: string, prompt: string, negativePrompt?: string): Promise<GeneratedImage>[] {
    const fullPrompt = `A professional product photograph of ${description}. Style: ${prompt}`;
    return Array(4).fill(null).map(() => generateSingleImageFromText(fullPrompt, negativePrompt));
}

export function generateProductImagesWithReference(productFile: File, referenceFile: File, prompt: string, negativePrompt?: string): Promise<GeneratedImage>[] {
    return Array(4).fill(null).map(() => generateSingleImageWithReference(productFile, referenceFile, prompt, negativePrompt));
}

export function generateProductImagesFromTextWithReference(description: string, referenceFile: File, prompt: string, negativePrompt?: string): Promise<GeneratedImage>[] {
    return Array(4).fill(null).map(() => generateSingleImageFromTextWithReference(description, referenceFile, prompt, negativePrompt));
}
