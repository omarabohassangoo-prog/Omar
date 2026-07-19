import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini Client
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (apiKey) {
  ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
  console.log("✅ Gemini API Client initialized successfully.");
} else {
  console.warn("⚠️ GEMINI_API_KEY is not set. AI Tutor chat will run in demo/offline mode.");
}

// API Endpoint for AI Tutor
app.post("/api/chat", async (req, res) => {
  const { messages } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Invalid messages format. Expected an array." });
  }

  // If Gemini client is not initialized, return high-quality offline response
  if (!ai) {
    return res.json({
      reply: "Hello! I am Aura, your offline AI Tutor. To activate my full potential, please configure your GEMINI_API_KEY in Settings > Secrets.",
      translation: "مرحباً! أنا أورا، معلمك الآلي في وضع عدم الاتصال. لتفعيل كامل قدراتي، يرجى تهيئة مفتاح GEMINI_API_KEY في الإعدادات.",
      correction: "You are doing great! Keep practicing.",
      tips: "Always remember to capitalize the first letter of a sentence and end it with a punctuation mark."
    });
  }

  try {
    const systemInstruction = `You are a friendly, patient, and expert English Language Tutor named 'Aura'.
Your goal is to help the user learn and practice English conversation.
Always be encouraging and speak in clear, simple English suited for learners.

You must analyze the user's message for any grammatical, spelling, punctuation, or phrasing mistakes.
If you find mistakes, explain them politely and provide the corrected version in the 'correction' field. If the user's message is correct, specify 'Excellent! Perfect grammar.'
Provide a natural Arabic translation of your reply in the 'translation' field to help them learn.
Provide a short, helpful learning tip in the 'tips' field (e.g., explaining a preposition, a phrasal verb, or a common idiom).`;

    // Map conversation history to Gemini contents format
    // messages: { sender: 'user'|'ai', text: string }[]
    const contents = messages.map((m: any) => {
      return {
        role: m.sender === "user" ? "user" : "model",
        parts: [{ text: m.text }]
      };
    });

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            reply: {
              type: Type.STRING,
              description: "Your friendly conversation reply in clear, simple English."
            },
            translation: {
              type: Type.STRING,
              description: "Natural Arabic translation of your reply."
            },
            correction: {
              type: Type.STRING,
              description: "Grammar, spelling, and phrasing corrections for the user's last message. Point out the mistake and show how to fix it."
            },
            tips: {
              type: Type.STRING,
              description: "A short, relevant English learning tip about grammar, vocabulary, or pronunciation."
            }
          },
          required: ["reply", "translation", "correction", "tips"]
        }
      }
    });

    const resultText = response.text;
    if (resultText) {
      const parsedResult = JSON.parse(resultText);
      return res.json(parsedResult);
    } else {
      throw new Error("Empty response received from Gemini.");
    }
  } catch (error: any) {
    console.error("❌ Gemini API Error:", error);
    return res.status(500).json({
      error: "Failed to connect to the AI Tutor. Please try again.",
      details: error.message
    });
  }
});

// Setup Vite Dev Server / Static Hosting
async function setupServer() {
  if (process.env.NODE_ENV !== "production") {
    console.log("🔧 Starting server in DEVELOPMENT mode with Vite Middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("🚀 Starting server in PRODUCTION mode...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🌍 Server running on http://localhost:${PORT}`);
  });
}

setupServer();
