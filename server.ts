import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

// Create the shared Gemini AI Client utility, setting User-Agent as instructed by the gemini-api skill
const getAiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('GEMINI_API_KEY is not configured in this workspace. Mood matching will run with high-fidelity system presets.');
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build'
      }
    }
  });
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route: Healthcheck
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', service: 'EchoCloud Client IPC Tunneling Services' });
  });

  // API Route: Smart AI Mood Matching DJ Handler
  app.post('/api/gemini/mood', async (req, res) => {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'No prompt indicator passed.' });
    }

    const ai = getAiClient();
    if (!ai) {
      // Fallback if no API key is specified yet
      const fallbackMoods = [
        {
          visualizerTheme: 'hologram',
          genre: 'Synthwave',
          aiResponse: 'Blowing past the digital roadblocks. We detected a fast outrun momentum. Buffering electronic synthesizers.',
          suggestedName: 'Cyber Hyperdrive Vibe'
        },
        {
          visualizerTheme: 'nebula',
          genre: 'Lo-Fi Chill',
          aiResponse: 'Watching caffeine patterns swell alongside open windows. Settling into calm lo-fi loops.',
          suggestedName: 'Cosmic Warm Coffee'
        }
      ];
      // Pick randomly
      const chosen = fallbackMoods[Math.floor(Math.random() * fallbackMoods.length)];
      return res.json({ ...chosen, note: 'Local simulation fallback of EchoCloud.' });
    }

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: `Analyze the user's emotional vibe/context prompt and advise what genre of underground electronic music fits best. Context: "${prompt}"`,
        config: {
          systemInstruction: 'You are our smart AI Ambient DJ inside the EchoCloud SoundCloud Client. Match the user prompt to one of our exact genres: "Synthwave", "Outrun", "Retrowave", "Lo-Fi Chill", "Ambient Cosmic", "Liquid DnB". Return a JSON answering matching styles.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              visualizerTheme: {
                type: Type.STRING,
                description: 'The optimal visualizer screen layout to activate. Must be exactly one of: "hologram", "nebula", "frequency".',
              },
              genre: {
                type: Type.STRING,
                description: 'The matched music genre. Must be exactly one of: "Synthwave", "Outrun", "Retrowave", "Lo-Fi Chill", "Ambient Cosmic", "Liquid DnB".',
              },
              aiResponse: {
                type: Type.STRING,
                description: 'A brief, evocative 2-sentence greeting or commentary as a futuristic AI DJ introducing the playlist matching their scene.',
              },
              suggestedName: {
                type: Type.STRING,
                description: 'An aesthetic, poetic 3-word title for the matching playlist (e.g. "Tarmac Neon Whispers", "Cosmic Warm Rain").',
              }
            },
            required: ['visualizerTheme', 'genre', 'aiResponse', 'suggestedName'],
          }
        }
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error('AI generated content text returned undefined.');
      }

      const parsed = JSON.parse(responseText.trim());
      res.json(parsed);

    } catch (err: any) {
      console.error('Gemini API query fail:', err);
      res.status(500).json({ 
        error: 'Intellectual node querying failed.', 
        details: err?.message,
        visualizerTheme: 'nebula',
        genre: 'Ambient Cosmic',
        aiResponse: 'We lost link to the neural AI DJ. Bypassing safely to Cosmic Ambient starfields.',
        suggestedName: 'Lost Orbit Station'
      });
    }
  });

  // Serve static folders or attach Vite Middlewares as requested
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`EchoCloud Client Core IPC Server listening online on: http://localhost:${PORT}`);
  });
}

startServer();
