// api/sage-hint.js — Gemini version
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const {
    mode = 'story', task = '', attempts = 0,
    student_action = '', goal = '', hint_level = 1,
    recent_choices = [], concept = '',
  } = req.body || {};

  const systemPrompt = `You are Sage, a calm and encouraging AI guide in Mathage, a math learning world for middle school students (grades 6-8).
Your personality: warm, gentle, quietly magical, never judgmental.
Your strict rules:
- NEVER give the final answer or a direct calculation
- NEVER say "correct" or "incorrect"
- ALWAYS respond with exactly 2 sentences: one observation, one guiding question
- Keep each sentence under 20 words
- Tone: calm, curious, encouraging
- Normalize struggle`;

  const userMessage = `Context:
- Mode: ${mode}, Task: ${task}, Concept: ${concept}
- Goal: ${goal}, Attempts: ${attempts}
- Student's last action: "${student_action}"
- Hint level: ${hint_level}
Generate Sage's response. Two sentences only: one warm observation, one guiding question. No answers.`;

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: systemPrompt + '\n\n' + userMessage }]
        }],
        generationConfig: {
          maxOutputTokens: 120,
          temperature: 0.7,
        }
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Gemini error:', err);
      return res.status(200).json({ message: getFallback(attempts, concept), fallback: true });
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (!text) return res.status(200).json({ message: getFallback(attempts, concept), fallback: true });

    return res.status(200).json({ message: text, hint_level, attempts });

  } catch (error) {
    console.error('sage-hint error:', error);
    return res.status(200).json({ message: getFallback(attempts, concept), fallback: true });
  }
}

function getFallback(attempts, concept) {
  const fallbacks = {
    ratio: [
      "You are looking at two quantities together. What do you notice about how they relate to each other?",
      "Something connects these two numbers. What happens if you see how many times one fits into the other?",
      "Think about the relationship, not the size. If both numbers changed the same way, would the balance hold?",
    ],
    default: [
      "You are thinking carefully about this. What is the first thing you notice about these numbers?",
      "You have tried more than once — that shows persistence. What feels different between your attempts?",
      "Take a moment to look at what stays the same and what changes. Does that help you see a pattern?",
    ],
  };
  const arr = fallbacks[concept] || fallbacks.default;
  return arr[Math.min(attempts, arr.length - 1)];
}
