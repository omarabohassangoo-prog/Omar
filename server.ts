import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));

// --- Safe File Manager API Endpoints ---
const getSafePath = (targetPath: string) => {
  const rootDir = process.cwd();
  const resolvedPath = path.resolve(rootDir, targetPath || ".");
  if (!resolvedPath.startsWith(rootDir)) {
    throw new Error("Access denied: Outside of workspace directory");
  }
  return resolvedPath;
};

// 1. List directory content
app.get("/api/admin/files/list", (req, res) => {
  try {
    const dirParam = (req.query.dir as string) || "";
    const safeDir = getSafePath(dirParam);
    
    if (!fs.existsSync(safeDir)) {
      return res.status(404).json({ error: "Directory not found" });
    }

    const items = fs.readdirSync(safeDir, { withFileTypes: true });
    
    const result = items
      .map(item => {
        const itemRelativePath = path.relative(process.cwd(), path.join(safeDir, item.name));
        let size = 0;
        try {
          size = fs.statSync(path.join(safeDir, item.name)).size;
        } catch (_) {}
        
        return {
          name: item.name,
          path: itemRelativePath || ".",
          isDirectory: item.isDirectory(),
          size
        };
      });
    
    // Sort directories first, then files
    result.sort((a, b) => {
      if (a.isDirectory && !b.isDirectory) return -1;
      if (!a.isDirectory && b.isDirectory) return 1;
      return a.name.localeCompare(b.name);
    });

    return res.json({ 
      success: true, 
      currentDir: path.relative(process.cwd(), safeDir) || ".", 
      items: result 
    });
  } catch (err: any) {
    return res.status(500).json({ error: "Failed to list directory", details: err.message });
  }
});

// 2. Read file content
app.get("/api/admin/files/read", (req, res) => {
  try {
    const filePathParam = req.query.path as string;
    if (!filePathParam) {
      return res.status(400).json({ error: "Path is required" });
    }
    const safePath = getSafePath(filePathParam);
    if (!fs.existsSync(safePath) || fs.statSync(safePath).isDirectory()) {
      return res.status(404).json({ error: "File not found or is a directory" });
    }

    // Check if binary (simple heuristic or common extensions)
    const binaryExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.ico', '.woff', '.woff2', '.ttf', '.pdf', '.zip', '.tar', '.gz', '.mp3', '.wav', '.ogg'];
    const ext = path.extname(safePath).toLowerCase();
    const isBinary = binaryExtensions.includes(ext);

    if (isBinary) {
      const content = fs.readFileSync(safePath);
      return res.json({
        success: true,
        path: filePathParam,
        isBinary: true,
        content: content.toString('base64')
      });
    } else {
      const content = fs.readFileSync(safePath, 'utf-8');
      return res.json({
        success: true,
        path: filePathParam,
        isBinary: false,
        content
      });
    }
  } catch (err: any) {
    return res.status(500).json({ error: "Failed to read file", details: err.message });
  }
});

// 3. Save or write file content
app.post("/api/admin/files/write", (req, res) => {
  try {
    const { path: filePathParam, content, isBase64 } = req.body;
    if (!filePathParam) {
      return res.status(400).json({ error: "Path is required" });
    }
    const safePath = getSafePath(filePathParam);

    // Ensure parent directory exists
    const parentDir = path.dirname(safePath);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }

    if (isBase64) {
      const buffer = Buffer.from(content, 'base64');
      fs.writeFileSync(safePath, buffer);
    } else {
      fs.writeFileSync(safePath, content || "", 'utf-8');
    }

    return res.json({ success: true, message: "تم حفظ الملف بنجاح" });
  } catch (err: any) {
    return res.status(500).json({ error: "Failed to save file", details: err.message });
  }
});

// 4. Create new empty file or folder
app.post("/api/admin/files/create", (req, res) => {
  try {
    const { path: targetPathParam, isDirectory } = req.body;
    if (!targetPathParam) {
      return res.status(400).json({ error: "Path is required" });
    }
    const safePath = getSafePath(targetPathParam);

    if (fs.existsSync(safePath)) {
      return res.status(400).json({ error: "الملف أو المجلد موجود بالفعل" });
    }

    if (isDirectory) {
      fs.mkdirSync(safePath, { recursive: true });
    } else {
      // Ensure parent directory exists
      const parentDir = path.dirname(safePath);
      if (!fs.existsSync(parentDir)) {
        fs.mkdirSync(parentDir, { recursive: true });
      }
      fs.writeFileSync(safePath, "", "utf-8");
    }

    return res.json({ success: true, message: "تم إنشاء العنصر بنجاح" });
  } catch (err: any) {
    return res.status(500).json({ error: "Failed to create item", details: err.message });
  }
});

// 5. Delete file or directory
app.post("/api/admin/files/delete", (req, res) => {
  try {
    const { path: targetPathParam } = req.body;
    if (!targetPathParam) {
      return res.status(400).json({ error: "Path is required" });
    }
    const safePath = getSafePath(targetPathParam);

    if (!fs.existsSync(safePath)) {
      return res.status(404).json({ error: "العنصر غير موجود" });
    }

    const stat = fs.statSync(safePath);
    if (stat.isDirectory()) {
      fs.rmSync(safePath, { recursive: true, force: true });
    } else {
      fs.unlinkSync(safePath);
    }

    return res.json({ success: true, message: "تم حذف العنصر بنجاح" });
  } catch (err: any) {
    return res.status(500).json({ error: "Failed to delete item", details: err.message });
  }
});

// API Endpoints for Admin Settings
app.get("/api/admin/settings", (req, res) => {
  const adsPath = path.join(process.cwd(), "public", "ads_config.json");
  try {
    if (fs.existsSync(adsPath)) {
      const data = fs.readFileSync(adsPath, "utf-8");
      return res.json(JSON.parse(data));
    }
    return res.status(404).json({ error: "Configuration file not found" });
  } catch (err: any) {
    return res.status(500).json({ error: "Failed to read configuration", details: err.message });
  }
});

app.post("/api/admin/settings", (req, res) => {
  const configData = req.body;
  if (!configData) {
    return res.status(400).json({ error: "No data provided" });
  }

  const adsPath = path.join(process.cwd(), "public", "ads_config.json");
  try {
    fs.writeFileSync(adsPath, JSON.stringify(configData, null, 2), "utf-8");
    
    // Also update dist/public or dist/ if running in production
    if (process.env.NODE_ENV === "production") {
      const distAdsPath = path.join(process.cwd(), "dist", "ads_config.json");
      try {
        fs.writeFileSync(distAdsPath, JSON.stringify(configData, null, 2), "utf-8");
      } catch (prodErr) {
        console.warn("Failed to write to production dist folder:", prodErr);
      }
    }
    
    return res.json({ success: true, message: "تم حفظ الإعدادات بنجاح" });
  } catch (err: any) {
    console.error("Failed to save configuration:", err);
    return res.status(500).json({ error: "Failed to save configuration", details: err.message });
  }
});

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

  // Determine Gemini client and model dynamically
  let chatAi = ai;
  let chatModel = "gemini-3.5-flash";

  try {
    const adsPath = path.join(process.cwd(), "public", "ads_config.json");
    if (fs.existsSync(adsPath)) {
      const config = JSON.parse(fs.readFileSync(adsPath, "utf-8"));
      if (config.gemini_api_key && config.gemini_api_key.trim()) {
        chatAi = new GoogleGenAI({
          apiKey: config.gemini_api_key.trim(),
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            }
          }
        });
      }
      if (config.gemini_model && config.gemini_model.trim()) {
        chatModel = config.gemini_model.trim();
      }
    }
  } catch (err) {
    console.error("Failed to read dynamic Gemini config, falling back to environment defaults:", err);
  }

  // If Gemini client is not initialized, return high-quality offline response
  if (!chatAi) {
    return res.json({
      reply: "Hello! I am Aura, your offline AI Tutor. To activate my full potential, please configure your GEMINI_API_KEY in Admin Dashboard > AI Settings or Settings > Secrets.",
      translation: "مرحباً! أنا أورا، معلمك الآلي في وضع عدم الاتصال. لتفعيل كامل قدراتي، يرجى تهيئة مفتاح GEMINI_API_KEY في لوحة تحكم المدير أو الإعدادات.",
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

    const response = await chatAi.models.generateContent({
      model: chatModel,
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
    if (resultText && typeof resultText === 'string' && resultText.trim()) {
      try {
        const parsedResult = JSON.parse(resultText);
        return res.json(parsedResult);
      } catch (parseError: any) {
        console.error('JSON Parse Error:', parseError);
        return res.status(500).json({ 
          error: 'Invalid response format from AI',
          details: parseError.message 
        });
      }
    } else {
      throw new Error("Empty or invalid response received from Gemini.");
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
    console.log(`Serving static files from: ${distPath}`);
    app.use(express.static(distPath));
    
    // Return 404 for missing assets instead of serving index.html
    app.use("/assets", (req, res) => {
      res.status(404).send("Asset not found");
    });
    
    app.use("/api", (req, res) => {
      res.status(404).send("API route not found");
    });

    app.get("*", (req, res) => {
      console.log(`Serving index.html for request: ${req.url}`);
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🌍 Server running on http://localhost:${PORT}`);
  });
}

setupServer();
