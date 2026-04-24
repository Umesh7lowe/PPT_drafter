import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface SlideContent {
  title: string;
  content: string[];
  notes?: string;
  type: 'title' | 'content' | 'image_left' | 'image_right' | 'comparison' | 'big_stat' | 'conclusion';
  imageKeyword?: string;
  statValue?: string;
  statLabel?: string;
}

export interface PresentationData {
  title: string;
  subtitle: string;
  slides: SlideContent[];
}

export async function analyzeManuscript(
  pdfBase64: string,
  timeLimit: number,
  theme: string,
  colorPalette: string
): Promise<PresentationData> {
  const model = "gemini-3-flash-preview"; 

  const prompt = `
    Analyze the attached journal publication PDF and generate a professional, visually engaging presentation structure.
    
    Context:
    - Time Limit: ${timeLimit} minutes (approx. ${Math.ceil(timeLimit / 2)} to ${timeLimit} slides)
    - Theme: ${theme}
    - Color Palette: ${colorPalette}
    
    Requirements:
    1. Extract key sections: Title, Abstract, Introduction, Methodology, Results, Discussion, Conclusion.
    2. Create a slide-by-slide breakdown with VARIED layouts.
    3. Layout Types:
       - 'title': For the first slide.
       - 'content': Standard bullet points.
       - 'image_left' or 'image_right': Text on one side, relevant image keyword for the other.
       - 'comparison': Two columns for comparing data or methods.
       - 'big_stat': A large number/statistic with a label (great for Results).
       - 'conclusion': Summary slide.
    4. For slides with images, provide a 'imageKeyword' (e.g., "microscope", "data chart", "laboratory").
    5. For 'big_stat' slides, provide 'statValue' (e.g., "95%") and 'statLabel' (e.g., "Accuracy").
    6. Include detailed speaker notes for each slide.
    
    Return the data in the following JSON format:
    {
      "title": "Main Title",
      "subtitle": "Subtitle",
      "slides": [
        {
          "title": "Slide Title",
          "content": ["Point 1", "Point 2"],
          "notes": "Speaker notes",
          "type": "content", // title, content, image_left, image_right, comparison, big_stat, conclusion
          "imageKeyword": "optional keyword",
          "statValue": "optional value",
          "statLabel": "optional label"
        }
      ]
    }
  `;

  const response = await ai.models.generateContent({
    model: model,
    contents: [
      {
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType: "application/pdf",
              data: pdfBase64,
            },
          },
        ],
      },
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          subtitle: { type: Type.STRING },
          slides: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                content: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                },
                notes: { type: Type.STRING },
                type: { 
                  type: Type.STRING,
                  enum: ['title', 'content', 'image_left', 'image_right', 'comparison', 'big_stat', 'conclusion']
                },
                imageKeyword: { type: Type.STRING },
                statValue: { type: Type.STRING },
                statLabel: { type: Type.STRING }
              },
              required: ["title", "content", "type"]
            }
          }
        },
        required: ["title", "subtitle", "slides"]
      }
    },
  });

  return JSON.parse(response.text);
}
