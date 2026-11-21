const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');

// Load environment from backend/.env first, then workspace root .env
dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const aiTriage = require('./services/aiTriage');
const complaintsRouter = require('./routes/complaints');
const statsRouter = require('./routes/stats');
const configRouter = require('./routes/config');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Static asset folders
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/samples', express.static(path.join(__dirname, 'samples')));

// API Routes
app.use('/api/complaints', complaintsRouter);
app.use('/api/stats', statsRouter);
app.use('/api/config', configRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'CivicLens AI Triage Backend',
    aiMode: aiTriage.isLiveAIConnected() ? 'Gemini AI Connected' : 'Demo Mode (NLP Engine)'
  });
});

// Serve frontend production build if available
const frontendDist = path.join(__dirname, '..', 'frontend', 'dist');
app.use(express.static(frontendDist));
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'Endpoint not found' });
  }
  const indexFile = path.join(frontendDist, 'index.html');
  res.sendFile(indexFile, (err) => {
    if (err) {
      res.status(200).send(`
        <!DOCTYPE html>
        <html>
          <head><title>CivicLens API</title></head>
          <body style="font-family: sans-serif; padding: 40px; text-align: center;">
            <h1 style="color: #059669;">CivicLens AI Triage Backend is Running</h1>
            <p>API endpoints are active at <code>/api/complaints</code> and <code>/api/stats</code>.</p>
            <p>To run the frontend in development mode, start the Vite server inside <code>frontend/</code>.</p>
          </body>
        </html>
      `);
    }
  });
});

app.listen(PORT, async () => {
  console.log(`=======================================================`);
  console.log(`CivicLens Backend running at http://localhost:${PORT}`);
  console.log(`API Health: http://localhost:${PORT}/api/health`);
  console.log(`Complaint Triage: http://localhost:${PORT}/api/complaints`);

  // Verify Gemini API key from environment (defaults to tech.habba)
  const envKey = process.env.GEMINI_API_KEY || 'tech.habba';
  if (envKey && envKey.trim().length >= 8) {
    try {
      const res = await aiTriage.verifyAndConnect(envKey.trim());
      console.log(`[CivicLens AI] Gemini AI Connected! Verified model: ${res.activeModel}`);
    } catch (err) {
      console.warn(`[CivicLens AI] Stored Gemini API key could not be verified: ${err.message}. Operating in Demo Mode.`);
    }
  } else {
    console.log(`[CivicLens AI] Operating in Demo Mode (Built-in Multilingual & Multimodal NLP Engine).`);
  }
  console.log(`=======================================================`);
});

module.exports = app;
