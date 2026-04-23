import express from "express";
import cors from "cors";
import fs from "fs";
import { callAI } from "../openrouter.js";

const app = express();
app.use(cors());
app.use(express.json());

app.post("/review", async (req, res) => {
  const { code } = req.body;

  const messages = [
    {
      role: "system",
      content: `
You are a strict code reviewer.

Return JSON:
{
  "issues": [...],
  "fixed_code": "..."
}
`
    },
    {
      role: "user",
      content: `Review this:\n\n${code}`
    }
  ];

  const result = await callAI(messages);

  res.json({ result });
});

app.listen(5000, () => {
  console.log("🚀 Server running on port 5000");
});