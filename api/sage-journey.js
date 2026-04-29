// api/sage-journey.js — Gemini version
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const {
    completed_tasks = [], persistence_pattern = '',
    common_sticking_points = [], mastered_concepts = [],
    total_attempts = 0, avg_attempts_per_task = 0, asked_for_hints = 0,
  } = req.body || {};

  const prompt = `You are Sage, a calm AI guide in Mathage, a math learning world for middle school students.
Generate a personalized journey reflection in exactly this JSON format:
{
  "observation": "one warm sentence about this student's learning pattern",
  "suggestion": "one concrete next step to try",
  "growth_note": "one honest note about growth you can see"
}
Rules: never mention scores or grades, focus on process and persistence, warm and age-appropriate tone, each value max 25 words.

Student data:
- Completed: ${completed_tasks.join(', ') || 'none yet'}
- Mastered: ${mastered_concepts.join(', ') || 'none yet'}
- Sticking points: ${common_sticking_points.join(', ') || 'none'}
- Persistence: ${persistence_pattern}
- Total attempts: ${total_attempts}
- Avg attempts per task: ${avg_attempts_per_task.toFixed ? avg_attempts_per_task.toFixed(1) : avg_attempts_per_task}
- Asked for hints: ${asked_for_hints} times

Return only the JSON object, nothing else.`;

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 200, temperature: 0.7 }
      }),
    });

    if (!response.ok) {
      return res.status(200).json(getFallback(persistence_pattern, mastered_concepts));
    }

    const data = await response.json();
    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';

    let parsed;
    try {
      const match = raw.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(match ? match[0] : raw);
    } catch(e) {
      return res.status(200).json(getFallback(persistence_pattern, mastered_concepts));
    }

    return res.status(200).json({
      observation: parsed.observation || '',
      suggestion:  parsed.suggestion  || '',
      growth_note: parsed.growth_note || '',
    });

  } catch(error) {
    console.error('sage-journey error:', error);
    return res.status(200).json(getFallback(persistence_pattern, mastered_concepts));
  }
}

function getFallback(persistence, concepts) {
  const obs = {
    high: "I noticed you often try more than one approach — that is real mathematical thinking.",
    medium: "You are building a steady rhythm of exploration each time you return.",
    low: "The fact that you keep coming back matters more than you might think.",
  };
  const sug = {
    high: "You may be ready for a task that asks you to compare multiple strategies.",
    medium: "Try a challenge that lets you use what you know in a new setting.",
    low: "Start with something familiar, then push just one step further.",
  };
  return {
    observation: obs[persistence] || obs.medium,
    suggestion:  sug[persistence] || sug.medium,
    growth_note: concepts.length > 0
      ? `Working with ${concepts.slice(0,2).join(' and ')} gives you tools that keep appearing in new forms.`
      : "Every concept you explore becomes a tool you carry forward.",
  };
}
