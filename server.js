require("dotenv").config();
const express = require("express");
const { v4: uuidv4 } = require("uuid");
const db = require("./db");
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// Config endpoint for Agora AI client
app.get('/config', (req, res) => {
  res.json({
    AGORA_APPID: process.env.AGORA_APPID,
    AGORA_TOKEN: process.env.AGORA_TOKEN,
    GROQ_KEY: process.env.GROQ_KEY,
    TTS_MINIMAX_KEY: process.env.TTS_MINIMAX_KEY,
    TTS_MINIMAX_GROUPID: process.env.TTS_MINIMAX_GROUPID,
    AVATAR_AKOOL_KEY: process.env.AVATAR_AKOOL_KEY
  });
});

// Proxy for Agora Conversational AI API
app.post('/api/convo-ai/start', async (req, res) => {
  try {
    const appid = process.env.AGORA_APPID;
    const apiKey = process.env.AGORA_REST_KEY;
    const apiSecret = process.env.AGORA_REST_SECRET;
    
    if (!appid || !apiKey || !apiSecret) {
      return res.status(500).json({ error: 'Server misconfigured: missing Agora credentials' });
    }

    const url = `https://api.agora.io/api/conversational-ai-agent/v2/projects/${appid}/join`;
    const basic = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${basic}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(req.body)
    });

    const data = await response.text();
    const status = response.status;

    try {
      return res.status(status).json(JSON.parse(data));
    } catch (e) {
      return res.status(status).send(data);
    }
  } catch (error) {
    console.error('Convo AI start error:', error);
    res.status(500).json({ error: String(error) });
  }
});

// Stop Agora Conversational AI
app.post('/api/convo-ai/agents/:agentId/leave', async (req, res) => {
  try {
    const { agentId } = req.params;
    const appid = process.env.AGORA_APPID;
    const apiKey = process.env.AGORA_REST_KEY;
    const apiSecret = process.env.AGORA_REST_SECRET;
    
    if (!appid || !apiKey || !apiSecret) {
      return res.status(500).json({ error: 'Server misconfigured: missing Agora credentials' });
    }

    const url = `https://api.agora.io/api/conversational-ai-agent/v2/projects/${appid}/agents/${agentId}/leave`;
    const basic = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${basic}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.text();
    const status = response.status;
    
    try {
      return res.status(status).json(JSON.parse(data));
    } catch (e) {
      return res.status(status).send(data);
    }
  } catch (error) {
    console.error('Convo AI stop error:', error);
    res.status(500).json({ error: String(error) });
  }
});

// POST /api/application/start
app.post("/api/application/start", async (req, res) => {
  try {
    const { job_id, full_name, email, mobile_number } = req.body;
    const applicant_id = uuidv4();

    await db.execute(
      "INSERT INTO applicants (applicant_id, job_id, full_name, email, mobile_number) VALUES (?, ?, ?, ?, ?)",
      [applicant_id, job_id, full_name, email, mobile_number]
    );

    res.json({ success: true, token: applicant_id });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/interview/session/:token
app.get("/api/interview/session/:token", async (req, res) => {
  try {
    const { token } = req.params;

    const [rows] = await db.execute(
      "SELECT a.*, j.title, j.job_requirements FROM applicants a JOIN jobs j ON a.job_id = j.job_id WHERE a.applicant_id = ?",
      [token]
    );

    if (rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, error: "Session not found" });
    }

    res.json({ success: true, data: rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/test-db - Test database connection
app.get("/api/test-db", async (req, res) => {
  try {
    const [rows] = await db.execute("SELECT 1 as test");
    res.json({
      success: true,
      message: "Database connected successfully!",
      data: rows,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/results/submit
app.post("/api/results/submit", async (req, res) => {
  try {
    const {
      applicant_id,
      score_overall,
      eye_contact_score,
      summary_text,
      improvement_tips,
    } = req.body;

    await db.execute(
      "INSERT INTO interview_results (applicant_id, score_overall, eye_contact_score, summary_text, improvement_tips) VALUES (?, ?, ?, ?, ?)",
      [
        applicant_id,
        score_overall,
        eye_contact_score,
        summary_text,
        improvement_tips,
      ]
    );

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/hr/applicants - Get all applicants with job details and results
app.get("/api/hr/applicants", async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT 
        a.applicant_id,
        a.full_name,
        a.email,
        a.mobile_number,
        a.status,
        j.title as job_title,
        r.score_overall,
        r.eye_contact_score,
        r.summary_text,
        r.improvement_tips
      FROM applicants a
      JOIN jobs j ON a.job_id = j.job_id
      LEFT JOIN interview_results r ON a.applicant_id = r.applicant_id
      ORDER BY a.applicant_id DESC
    `);

    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/jobs - Get open jobs only (for applicant view)
app.get("/api/jobs", async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM jobs WHERE status = "Open"');
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/hr/jobs - Get all jobs (for HR dashboard)
app.get("/api/hr/jobs", async (req, res) => {
  try {
    const [rows] = await db.execute("SELECT * FROM jobs ORDER BY job_id DESC");
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/hr/jobs - Create new job
app.post("/api/hr/jobs", async (req, res) => {
  try {
    const { title, job_requirements, status = "Open" } = req.body;

    const [result] = await db.execute(
      "INSERT INTO jobs (title, job_requirements, status) VALUES (?, ?, ?)",
      [title, job_requirements, status]
    );

    res.json({ success: true, job_id: result.insertId });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/hr/jobs/:id - Update job
app.put("/api/hr/jobs/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { title, job_requirements, status } = req.body;

    await db.execute(
      "UPDATE jobs SET title = ?, job_requirements = ?, status = ? WHERE job_id = ?",
      [title, job_requirements, status, id]
    );

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/hr/jobs/:id - Delete job
app.delete("/api/hr/jobs/:id", async (req, res) => {
  try {
    const { id } = req.params;

    await db.execute("DELETE FROM jobs WHERE job_id = ?", [id]);

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/hr/applicants/:id/status - Update applicant status
app.put("/api/hr/applicants/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    await db.execute(
      "UPDATE applicants SET status = ? WHERE applicant_id = ?",
      [status, id]
    );

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
