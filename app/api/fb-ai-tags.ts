import { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';
import fetch from 'node-fetch';

const ai = new GoogleGenAI({ apiKey: process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || '' });

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    
    try {
        const { imageUrls, imageBase64, name, description } = req.body;
        
        if ((!imageUrls || !Array.isArray(imageUrls) || imageUrls.length === 0) && !imageBase64) {
            return res.status(400).json({ error: 'No images provided' });
        }

        let inlineData = null;

        if (imageBase64) {
            inlineData = {
                data: imageBase64,
                mimeType: 'image/jpeg'
            };
        } else {
            const imageUrl = imageUrls[0];
            console.log('[fb-ai-tags] Fetching image:', imageUrl);
            
            try {
                const imgRes = await fetch(imageUrl);
                if (!imgRes.ok) throw new Error(`HTTP error! status: ${imgRes.status}`);
                
                const arrayBuffer = await imgRes.arrayBuffer();
                const buffer = Buffer.from(arrayBuffer);
                const contentType = imgRes.headers.get('content-type') || 'image/jpeg';
                
                inlineData = {
                    data: buffer.toString('base64'),
                    mimeType: contentType
                };
            } catch (imgError) {
                console.error('[fb-ai-tags] Error fetching image:', imgError);
                return res.status(500).json({ error: 'Failed to process image' });
            }
        }

        const prompt = `Analyze this product image and generate up to 10 highly relevant search tags (keywords) in MONGOLIAN. 
Product name: "${name || 'Unknown'}"
Product description: "${description || 'None'}"

Rules for tags:
1. Short, concise keywords (1-2 words max per tag).
2. Must be in Mongolian language.
3. Include synonyms, related category words, materials, colors, or usage scenarios visible in the image.
4. Output ONLY a comma-separated list of tags, nothing else. No markdown, no bullet points.

Example output: цүнх, эмэгтэй, арьсан, жижиг, хар, гоёл чимэглэл`;

        console.log('[fb-ai-tags] Sending request to Gemini');
        const contents = [{
            role: 'user',
            parts: [
                { inlineData },
                { text: prompt }
            ]
        }];

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents,
        });

        const reply = response.text || '';
        console.log('[fb-ai-tags] Raw Gemini response:', reply);
        
        // Clean up the reply and split by comma
        const tags = reply
            .split(',')
            .map(t => t.trim())
            .filter(t => t.length > 0)
            .slice(0, 10); // Enforce max 10
            
        return res.status(200).json({ tags });
        
    } catch (error) {
        console.error('[fb-ai-tags] Error generating tags:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
