import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));   // 直接托管前端文件

/* ── /explain ── AI解释答案 ── */
app.post("/explain", async (req, res) => {
  const { word, meaning, correct, userAns } = req.body;

  const prompt = correct
    ? `The user correctly answered the vocabulary word "${word}" (meaning: ${meaning || "unknown"}). Give ONE short encouraging sentence in Chinese (20 words max) and mention a useful memory tip or usage note about this word.`
    : `The user answered "${userAns}" but the correct answer is "${word}" (meaning: ${meaning || "unknown"}). In Chinese, give ONE short sentence explaining why the correct answer is "${word}", and a simple memory tip. Keep it under 30 words.`;

  try {
    const response = await fetch("https://router.huggingface.co/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.HF_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "meta-llama/Llama-3.3-70B-Instruct",
        messages: [
          {
            role: "system",
            content: "You are a vocabulary tutor. Reply ONLY in Chinese. Be concise (under 30 words). No markdown.",
          },
          { role: "user", content: prompt },
        ],
        max_tokens: 120,
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.choices?.length) {
      return res.json({ explain: correct ? "答对了，继续保持！" : `正确答案是 ${word}，加油！` });
    }

    res.json({ explain: data.choices[0].message.content.trim() });
  } catch (err) {
    console.error(err);
    res.json({ explain: correct ? "答对了！" : `正确答案：${word}` });
  }
});

app.listen(3000, () => console.log("WordSpark running → http://localhost:3000"));
