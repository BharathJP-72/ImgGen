import express from 'express'
import * as dotenv from 'dotenv'
import OpenAI from 'openai'

dotenv.config()

const router = express.Router()

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// ✅ TEST ROUTE (IMPORTANT)
router.get('/', (req, res) => {
  res.send('DALL·E route is working')
})

// ✅ THIS IS WHAT YOUR FRONTEND CALLS
router.post('/', async (req, res) => {
  try {
    const { prompt } = req.body

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' })
    }

    const image = await openai.images.generate({
      model: 'gpt-image-1',
      prompt,
      size: '1024x1024',
    })

    res.status(200).json({
      photo: image.data[0].url, // URL, not base64
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Image generation failed' })
  }
})

export default router
