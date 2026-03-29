import { NextRequest, NextResponse } from 'next/server';

const SYSTEM_PROMPT = `
You are a friendly personal morning assistant. You give concise, warm, and practical daily briefings. Never make up events or weather — use only the data provided.
`;

export async function POST(req: NextRequest) {
    // Debug: Log the first and last part of the API key (only in development)
    if (process.env.NODE_ENV !== 'production') {
      const key = process.env.AZURE_OPENAI_KEY || '';
      console.log('AZURE_OPENAI_KEY (partial):', key.slice(0, 6) + '...' + key.slice(-4));
    }
  const data = await req.json();

  const events = (data.calendar_events || []).slice(0, 5);
  const eventsStr = events.length
    ? events
        .map(
          (e: any) =>
            `  - ${e.summary} at ${e.start}${e.location ? ` @ ${e.location}` : ''}`
        )
        .join('\n')
    : '  - No events scheduled today';

  const prompt = `
${SYSTEM_PROMPT}

User: ${data.user_name}
Location: ${data.city}

Today's Weather:
${data.weather.description?.charAt(0).toUpperCase() + data.weather.description?.slice(1)}, ${data.weather.temp}°C
Feels like ${data.weather.feels_like}°C, humidity ${data.weather.humidity}%

Today's Calendar:
${eventsStr}

Write a warm, helpful morning briefing in 3-4 sentences.
Mention the weather naturally, highlight the most important event,
and give one actionable tip for the day.
Do not use bullet points. Write in a friendly conversational tone.
  `.trim();

  // Call Azure OpenAI API
  const openaiRes = await fetch(`${process.env.AZURE_OPENAI_ENDPOINT}`, {
    method: 'POST',
    headers: {
      'api-key': `${process.env.AZURE_OPENAI_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
    }),
  });

  const aiData = await openaiRes.json();
  const briefing =
    aiData.choices?.[0]?.message?.content?.trim() ||
    `Good morning, ${data.user_name}! It's ${data.weather.description} today at ${data.weather.temp}°C in ${data.city}. You have ${events.length} event(s) today. Have a great day!`;

  return NextResponse.json({ briefing });
}