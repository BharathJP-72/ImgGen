import express from 'express';
import * as dotenv from 'dotenv';
import axios from 'axios';
import { GoogleGenerativeAI } from "@google/generative-ai"; // Added Import

dotenv.config();

const router = express.Router();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

router.route('/').post(async (req, res) => {
  try {
    const { prompt } = req.body;
    
    const cleanPrompt = prompt.replace(/[^a-zA-Z0-9 ]/g, "");
    const encodedPrompt = encodeURIComponent(cleanPrompt);
    
    const browserHeaders = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
    };

    // --- LAYER 1: GEMINI API (Google Imagen 3.0) ---
    try {
        console.log(`Layer 1: Attempting Google Imagen 3.0 for "${cleanPrompt}"...`);
        
        // We use the specific model ID for image generation
        const model = genAI.getGenerativeModel({ model: "imagen-3.0-generate-001" });
        
        // Request image generation
        const result = await model.generateContent(prompt);
        const response = await result.response;
        
        // Check if Google returned an inline image (Base64)
        if (response.candidates && response.candidates[0].content.parts[0].inlineData) {
            const googleImage = response.candidates[0].content.parts[0].inlineData.data;
            console.log("Success: Generated with Google Imagen 3!");
            return res.status(200).json({ photo: googleImage });
        }
        
    } catch (geminiError) {
        console.warn(`Layer 1 (Gemini) Failed. Switching to Stock Search...`);
    }

    // --- LAYER 2: LoremFlickr (Stock Photo Search) ---
    try {
        console.log(`Layer 2: Searching stock photos for "${cleanPrompt}"...`);
        const stockUrl = `https://loremflickr.com/800/800/${encodedPrompt}`;
        
        const response = await axios.get(stockUrl, { 
            responseType: 'arraybuffer',
            headers: browserHeaders,
            timeout: 8000
        });
        
        const base64Image = Buffer.from(response.data, 'binary').toString('base64');
        console.log("Success: Found stock photo matching prompt.");
        return res.status(200).json({ photo: base64Image });

    } catch (stockError) {
        console.warn(`Layer 2 Failed. Switching to Deterministic Backup...`);
    }

    // --- LAYER 3: Picsum Seed (Fallback) ---
    try {
        console.log(`Layer 3: generating deterministic fallback...`);
        const backupUrl = `https://picsum.photos/seed/${encodedPrompt}/1024/1024`;
        
        const response = await axios.get(backupUrl, { 
            responseType: 'arraybuffer',
            headers: browserHeaders,
            timeout: 5000 
        });
        
        const base64Image = Buffer.from(response.data, 'binary').toString('base64');
        console.log("Success: Deterministic fallback generated.");
        return res.status(200).json({ photo: base64Image });
        
    } catch (finalError) {
        console.error("All layers failed.");
        res.status(500).json({ error: 'Failed to generate image' });
    }

  } catch (criticalError) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;