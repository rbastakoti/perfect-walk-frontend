
import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

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

  // Support both 'calendar' and 'calendar_events' for events
  const eventsRaw = data.calendar_events || data.calendar?.events || [];
  const events = Array.isArray(eventsRaw) ? eventsRaw.slice(0, 5) : [];
  const eventsStr = events.length
    ? events
        .map(
          (e: any) =>
            `  - ${e.summary} at ${e.start || e.startTime || ''}${e.location ? ` @ ${e.location}` : ''}`
        )
        .join('\n')
    : '  - No events scheduled today';


  // Support both 'weather' and 'weatherData' for weather info
  let weather = data.weather || data.weatherData || null;

  // Fallback: try to read from .next/server/app/_weather_cache.json (if exists)
  if (!weather) {
    try {
      // This path assumes you write weather to a cache file on the server (customize as needed)
      const cachePath = path.resolve(process.cwd(), '.next/server/app/_weather_cache.json');
      const file = await fs.readFile(cachePath, 'utf8');
      const cachedWeather = JSON.parse(file);
      if (cachedWeather && typeof cachedWeather === 'object') {
        weather = cachedWeather;
      }
    } catch (e) {
      // No cache file or error reading it
    }
  }


  // Only include temperature if available
  let weatherLine = '';
  if (weather && typeof weather.temp === 'number') {
    const tempC = Math.round(weather.temp);
    const tempF = Math.round((weather.temp * 9) / 5 + 32);
    weatherLine = `Temperature: ${tempC}°C (${tempF}°F)`;
  }

  const prompt = `
${SYSTEM_PROMPT}

User: ${data.user_name}
Location: ${data.city || data.location || 'Unknown'}
${weatherLine ? `\n${weatherLine}` : ''}

Today's Calendar:
${eventsStr}

Write a warm, helpful morning briefing in 3-4 sentences.
If temperature is provided, you may mention it naturally, but do not mention weather otherwise.
Highlight the most important event, and give one actionable mental health tip for the day.
Do not use bullet points. Write in a friendly, encouraging, mental health–oriented tone.
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
  let briefing = aiData.choices?.[0]?.message?.content?.trim();
  if (!briefing) {
    // Fallback: Only mention location, events, and mental health encouragement
    const name = data.user_name || 'friend';
    const city = data.city || data.location || 'your area';
    let eventMsg = '';
    if (events.length === 0) {
      eventMsg = "You have a free day ahead—maybe take some time for yourself or try something new.";
    } else if (events.length === 1) {
      eventMsg = `You have one event: ${events[0].summary} at ${events[0].start || events[0].startTime || ''}${events[0].location ? ` @ ${events[0].location}` : ''}.`;
    } else {
      eventMsg = `Your day includes: ` + events.map(e => `${e.summary} at ${e.start || e.startTime || ''}`).join(", ") + ".";
    }
    briefing = `Good morning, ${name}! Here's your schedule for ${city}: ${eventMsg} Remember to take a mindful moment for yourself today.`;
  }
  return NextResponse.json({ briefing });
}