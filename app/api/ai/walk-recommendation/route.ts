import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    // Debug: Log the first and last part of the API key (only in development)
    if (process.env.NODE_ENV !== 'production') {
      const key = process.env.AZURE_OPENAI_KEY || '';
      console.log('AZURE_OPENAI_KEY (partial):', key.slice(0, 6) + '...' + key.slice(-4));
    }
  const data = await req.json();

  // Accept and forward all fields: location, calendar, weather, parks, places, walk_options
  const { user_name, location, calendar, weather, parks, places, walk_options = [] } = data;

  // Build walk options string (limit: max 7)
  const limitedWalkOptions = (walk_options || []).slice(0, 7);
  const walkList = limitedWalkOptions
    .map(
      (w: any) =>
        `- ${w.name}: ${w.duration_min} min, ${w.distance_miles} miles, features: ${w.features}`
    )
    .join('\n');


  // Find the best park/place with lat/lon for context
  let bestLat = null, bestLon = null;
  if (Array.isArray(parks) && parks.length > 0) {
    const best = parks.find((p: any) => p.lat && p.lon);
    if (best) { bestLat = best.lat; bestLon = best.lon; }
  }
  if (!bestLat && Array.isArray(places) && places.length > 0) {
    const best = places.find((p: any) => p.lat && p.lon);
    if (best) { bestLat = best.lat; bestLon = best.lon; }
  }

  const parksList = Array.isArray(parks) && parks.length > 0
    ? parks.map((p: any) => `- ${p.name || p.label || 'Park'}${p.distance ? ` (${p.distance}m)` : ''}${p.lat && p.lon ? ` [lat: ${p.lat}, lon: ${p.lon}]` : ''}`).join('\n')
    : '';
  const placesList = Array.isArray(places) && places.length > 0
    ? places.map((p: any) => `- ${p.name || p.label || 'Place'}${p.distance ? ` (${p.distance}m)` : ''}${p.lat && p.lon ? ` [lat: ${p.lat}, lon: ${p.lon}]` : ''}`).join('\n')
    : '';

  const prompt = `
    You are a helpful assistant for recommending outdoor walks to reduce stress.
    User: ${user_name}
    Location: ${location}
    Weather: ${weather?.description}, ${weather?.temp}°C, feels like ${weather?.feels_like}°C, humidity ${weather?.humidity}%
    Next meeting: ${calendar?.next_meeting ?? 'N/A'} in ${calendar?.next_meeting_in_min ?? 'N/A'} minutes
    Available time: ${calendar?.free_time_min ?? 'N/A'} minutes

    Here are the nearby walk options (minimum 3, maximum 7):
    ${walkList}

    ${parksList ? `Nearby parks:\n${parksList}` : ''}
    ${placesList ? `Nearby places:\n${placesList}` : ''}

    For the recommended walk, you MUST select a real park or place from the lists above (parks or places) if any are available. Use the exact name and coordinates (lat, lon) from the selected park/place. Only if there are no parks or places available, you may invent a name and estimate the coordinates.

    Return a JSON object with these keys: name, duration_min, distance_miles, features, description, lat, lon. The name, lat, and lon must match the selected park/place if one is used.
    The description should be 1-2 motivating sentences explaining why it's a good match for the user's current context.
    Do not return a list. Do not include any other walks. Only return the single best walk as a JSON object.
  `;

  // Call OpenAI/Gemini API (example with OpenAI)
  const openaiRes = await fetch(`${process.env.AZURE_OPENAI_ENDPOINT}`, {
    method: 'POST',
    headers: {
      'api-key': `${process.env.AZURE_OPENAI_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
    }),
  });

  const aiData = await openaiRes.json();
  const text = aiData.choices?.[0]?.message?.content || '';

  // Debug: return raw AI response and error info
  if (aiData.error) {
    return NextResponse.json({
      recommendations: [],
      error: aiData.error,
      raw_ai_response: text,
      aiData
    }, { status: 500 });
  }

  // Extract JSON object or array from AI response
  let recommendations = null;
  let parseError = null;
  // Try to extract ```json ... ``` block first
  let jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/i);
  let jsonString = jsonMatch ? jsonMatch[1] : text;
  try {
    recommendations = JSON.parse(jsonString);
  } catch (e) {
    // Try to extract first {...} block if failed
    const objMatch = text.match(/{[\s\S]*}/);
    if (objMatch) {
      try {
        recommendations = JSON.parse(objMatch[0]);
      } catch (e2) {
        parseError = (e2 as Error).message;
      }
    } else {
      parseError = (e as Error).message;
    }
  }

  // Enforce: recommendation must match a real park/place if available
  function normalizeName(n: any) {
    return (n || "").toString().trim().toLowerCase();
  }
  function matchPlaceOrPark(rec: any, parks: any, places: any) {
    if (!rec) return null;
    const all = [
      ...(Array.isArray(parks) ? parks : []),
      ...(Array.isArray(places) ? places : [])
    ];
    const recName = normalizeName(rec.name);
    // Try to match by name and coordinates
    return all.find(p => {
      const pName = normalizeName(p.name || p.label);
      const latMatch = p.lat && rec.lat && Number(p.lat) === Number(rec.lat);
      const lonMatch = p.lon && rec.lon && Number(p.lon) === Number(rec.lon);
      return pName && recName && pName === recName && latMatch && lonMatch;
    }) ||
    // Fallback: match by name only
    all.find(p => {
      const pName = normalizeName(p.name || p.label);
      return pName && recName && pName === recName;
    });
  }

  let parksArr = Array.isArray(parks) ? parks : [];
  let placesArr = Array.isArray(places) ? places : [];
  let rec = recommendations;
  // If array, take first
  if (Array.isArray(rec)) rec = rec[0];
  let matched = matchPlaceOrPark(rec, parksArr, placesArr);

  // If not matched, fallback to best real park/place
  if (!matched && (parksArr.length > 0 || placesArr.length > 0)) {
    // Prefer parks, then places
    matched = parksArr.find(p => p.lat && p.lon && p.name) || placesArr.find(p => p.lat && p.lon && p.name);
    if (matched) {
      rec = {
        name: matched.name || matched.label || "Best Place",
        lat: matched.lat,
        lon: matched.lon,
        features: matched.features || [],
        description: rec?.description || `A walk at ${matched.name || matched.label}`,
        duration_min: rec?.duration_min || 30,
        distance_miles: rec?.distance_miles || 1.0,
      };
    }
  }

  return NextResponse.json({
    recommendation: rec,
    raw_ai_response: text,
    aiData,
    parseError
  });
}