import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import pino from "pino";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import cors from "cors";

dotenv.config();

const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  transport: process.env.NODE_ENV !== "production" ? { target: 'pino-pretty' } : undefined,
});

const app = express();
const PORT = Number(process.env.PORT || 3000);

app.use(express.json({ limit: '100kb' }));
app.use(helmet());

// CORS: allow explicit origin or localhost during development
const allowedOrigin = process.env.FRONTEND_ORIGIN || 'http://localhost:3000';
app.use(cors({ origin: allowedOrigin }));

// Basic rate limiting to protect /api/chat
const chatLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: Number(process.env.RATE_LIMIT_MAX) || 30, // max requests per window per IP
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({ error: 'Too many requests. Please slow down.' });
  }
});

// Initialize Gemini Client (Google GenAI)
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (apiKey) {
  try {
    ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
    logger.info('Gemini API client initialized');
  } catch (e) {
    logger.error({ err: e }, 'Failed to initialize Gemini client');
    ai = null;
  }
} else {
  logger.warn('GEMINI_API_KEY is not set. AI Tutor will run in demo/offline mode.');
}

// Helper: validate incoming messages
function validateMessages(messages: any): { valid: boolean; reason?: string } {
  if (!Array.isArray(messages)) return { valid: false, reason: 'messages must be an array' };
  if (messages.length === 0) return { valid: false, reason: 'messages must not be empty' };
  if (messages.length > 20) return { valid: false, reason: 'messages array too long (max 20 entries)' };
  for (const m of messages) {
    if (!m || typeof m !== 'object') return { valid: false, reason: 'each message must be an object' };
    if (typeof m.text !== 'string') return { valid: false, reason: 'each message must have a text string' };
    if (m.text.length > 5000) return { valid: false, reason: 'message text too long (max 5000 characters)' };
  }
  return { valid: true };
}

// Helper: timeout wrapper
function withTimeout<T>(promise: Promise<T>, ms: number, errorMessage = 'Operation timed out') {
  let timer: NodeJS.Timeout;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(errorMessage)), ms);
  });
  return Promise.race([promise, timeoutPromise]) as Promise<T>;
}

// Helper: retry wrapper (simple)
async function retry<T>(fn: () => Promise<T>, attempts = 2, delayMs = 300) {
  let lastErr: any;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
      if (i < attempts - 1) await new Promise(r => setTimeout(r, delayMs));
    }
  }
  throw lastErr;
}

// API Endpoint for AI Tutor
app.post('/api/chat', chatLimiter, async (req, res) => {
  const { messages } = req.body;

  // Basic validation
  const validation = validateMessages(messages);
  if (!validation.valid) {
    return res.status(400).json({ error: validation.reason });
  }

  // Offline/demo fallback
  if (!ai) {
    return res.json({
      reply: "مرحباً! أنا Aura، معلمك الآلي في وضع عدم الاتصال. لتفعيل كامل القدرات، اضف مفتاح GEMINI_API_KEY في إعدادات البيئة.",
      translation: "Hello! I'm Aura, your offline AI Tutor. To enable full features, set GEMINI_API_KEY in your environment.",
      correction: "You are doing great! Keep practicing.",
      tips: "تذكّر دائمًا كتابة الحرف الأول من الجملة بحرف كبير وانتهاء الجملة بعلامة ترقيم."
    });
  }

  try {
    const systemInstruction = `You are a friendly, patient, and expert English Language Tutor named 'Aura'.\nYour goal is to help the user learn and practice English conversation.\nAlways be encouraging and provide corrections, translations, and tips when appropriate.`;

    // Map conversation history to Gemini contents format
    const contents = messages.map((m: any) => ({ role: m.sender === 'user' ? 'user' : 'model', parts: [{ text: m.text }] }));

    // Prepare call parameters
    const call = async () => {
      return await ai!.models.generateContent({
        model: 'gemini-3.5-flash',
        contents,
        config: {
          systemInstruction,
          temperature: 0.7,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              reply: { type: Type.STRING },
              translation: { type: Type.STRING },
              correction: { type: Type.STRING },
              tips: { type: Type.STRING }
            },
            required: ['reply', 'translation', 'correction', 'tips']
          }
        }
      });
    };

    // Execute with retry + timeout
    const response = await retry(() => withTimeout(call(), 15_000, 'Gemini request timed out'), 2, 500);

    // Flexible parsing of SDK response shapes
    const rawResponse: any = response as any;
    let resultText: string | undefined = undefined;

    // Common fields
    if (typeof rawResponse?.text === 'string') resultText = rawResponse.text;
    if (!resultText && typeof rawResponse?.output_text === 'string') resultText = rawResponse.output_text;

    // Nested output candidates/content
    if (!resultText && Array.isArray(rawResponse?.output) && rawResponse.output.length > 0) {
      try {
        const out0 = rawResponse.output[0];
        if (out0?.content && Array.isArray(out0.content) && out0.content.length > 0) {
          const part = out0.content[0];
          if (typeof part?.text === 'string') resultText = part.text;
          else resultText = JSON.stringify(out0.content);
        }
      } catch (e) {
        // ignore parsing error here and continue
      }
    }

    if (!resultText && Array.isArray(rawResponse?.candidates) && rawResponse.candidates.length > 0) {
      const cand = rawResponse.candidates[0];
      if (typeof cand?.content === 'string') resultText = cand.content;
      else if (cand?.content) resultText = JSON.stringify(cand.content);
    }

    // As a last resort, stringify the whole response (safe fallback)
    if (!resultText) {
      try {
        resultText = JSON.stringify(rawResponse);
      } catch (e) {
        resultText = String(rawResponse);
      }
    }

    if (!resultText || typeof resultText !== 'string') {
      logger.error({ rawResponse }, 'Gemini returned empty or unexpected response shape');
      return res.status(502).json({ error: 'Upstream service returned an unexpected response' });
    }

    let parsedResult: any;
    try {
      parsedResult = JSON.parse(resultText);
    } catch (e) {
      // If not JSON, attempt best-effort extraction: treat the entire resultText as reply
      logger.warn({ resultText }, 'Gemini response is not JSON; using best-effort fallback');
      parsedResult = { reply: resultText, translation: '', correction: '', tips: '' };
    }

    // Normalize fields: ensure reply and translation exist
    const reply = parsedResult?.reply || parsedResult?.output_text || parsedResult?.text || String(parsedResult);
    const translation = parsedResult?.translation || '';
    const correction = parsedResult?.correction || '';
    const tips = parsedResult?.tips || '';

    if (!reply) {
      logger.warn({ parsedResult }, 'Gemini response missing expected reply field');
      return res.status(502).json({ error: 'Incomplete response from AI service' });
    }

    // Return only structured fields (avoid leaking internals)
    return res.json({ reply, translation, correction, tips });
  } catch (error: any) {
    logger.error({ err: error }, 'Gemini API Error');
    return res.status(500).json({ error: 'Failed to connect to the AI Tutor. Please try again later.' });
  }
});

// Setup Vite Dev Server / Static Hosting
async function setupServer() {
  if (process.env.NODE_ENV !== 'production') {
    logger.info('Starting server in development mode with Vite middleware...');
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
  } else {
    logger.info('Starting server in production mode');
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => res.sendFile(path.join(distPath, 'index.html')));
  }

  app.listen(PORT, '0.0.0.0', () => {
    logger.info(`Server running on http://localhost:${PORT}`);
  });
}

setupServer();
