import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Body parsing middleware
  app.use(express.json());

  // API Route: healthcheck
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // API Route: chat proxy for Prime Theory Assistant
  app.post("/api/chat", async (req, res) => {
    const { messages, currentPrime } = req.body;

    if (!messages || !Array.isArray(messages)) {
      res.status(400).json({ error: "Invalid 'messages' parameter." });
      return;
    }

    try {
      // Build the list of text prompts
      const formattedContents = messages.map((m: any) => m.content).join('\n');

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: formattedContents,
        config: {
          systemInstruction: `You are a mathematical assistant specialized in number theory and primes. 
          The user is interacting with a 3D visualization of primes. 
          Current focused prime: ${currentPrime || 'None'}.
          If a prime is selected, you can reference if it is a Mersenne prime, part of a twin prime pair, or other interesting properties.
          Keep responses concise, insightful, and slightly mystical. Encourage the user to explore specific gaps or sequences like the Fibonacci sequence's intersection with primes.
          Maintain a "Technical Agent" tone: analytical, cold but insightful.`
        }
      });

      res.json({ text: response.text || "Process completed." });
    } catch (error: any) {
      console.error("Gemini API Error:", error);
      res.status(500).json({ error: error?.message || "Internal server error." });
    }
  });

  // Vite middleware for development vs static asset serving for production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
