"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import WeatherCard from "@/components/WeatherCard";
import ParksCard from "@/components/ParksCard";
import CalendarCard from "@/components/CalendarCard";

interface LocationState {
  lat: number;
  lon: number;
  error?: string;
}

export default function DashboardPage() {
  const { status } = useSession();
  const router = useRouter();
  const [location, setLocation] = useState<LocationState | null>(null);
  const [placeName, setPlaceName] = useState<string | null>(null);
  const [weather, setWeather] = useState<any>(null);
  const [parks, setParks] = useState<any[]>([]);
  const [calendar, setCalendar] = useState<any[]>([]);
  const [loading, setLoading] = useState({ location: true, weather: false, parks: false, calendar: false });
  const [errors, setErrors] = useState({ weather: "", parks: "", calendar: "" });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocation({ lat: 0, lon: 0, error: "Geolocation not supported by your browser." });
      setLoading((l) => ({ ...l, location: false }));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lon } = pos.coords;
        setLocation({ lat, lon });
        setLoading((l) => ({ ...l, location: false }));
        fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`)
          .then((r) => r.json())
          .then((d) => {
            const a = d.address ?? {};
            const name = [a.suburb ?? a.neighbourhood ?? a.city_district, a.city ?? a.town ?? a.village]
              .filter(Boolean).join(", ");
            setPlaceName(name || d.display_name?.split(",")[0] || null);
          })
          .catch(() => {});
      },
      (err) => {
        setLocation({ lat: 0, lon: 0, error: err.message });
        setLoading((l) => ({ ...l, location: false }));
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  useEffect(() => {
    if (status !== "authenticated") return;
    setLoading((l) => ({ ...l, calendar: true }));
    fetch("/api/calendar")
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setCalendar(data.events ?? []);
      })
      .catch((e) => setErrors((err) => ({ ...err, calendar: e.message })))
      .finally(() => setLoading((l) => ({ ...l, calendar: false })));
  }, [status]);

  useEffect(() => {
    if (!location || location.error || !location.lat) return;

    const { lat, lon } = location;

    // Fetch weather
    setLoading((l) => ({ ...l, weather: true }));
    fetch(`/api/weather?lat=${lat}&lon=${lon}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setWeather(data);
      })
      .catch((e) => setErrors((err) => ({ ...err, weather: e.message })))
      .finally(() => setLoading((l) => ({ ...l, weather: false })));

    // Fetch parks
    setLoading((l) => ({ ...l, parks: true }));
    fetch(`/api/parks?lat=${lat}&lon=${lon}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setParks(data.elements || []);
      })
      .catch((e) => setErrors((err) => ({ ...err, parks: e.message })))
      .finally(() => setLoading((l) => ({ ...l, parks: false })));
  }, [location]);

  if (status === "loading" || loading.location) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4 animate-bounce">🌳</div>
          <p className="text-indigo-600 font-medium">
            {loading.location ? "Accessing your location..." : "Loading..."}
          </p>
        </div>
      </div>
    );
  }

  if (location?.error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md mx-4 text-center">
          <span className="text-5xl block mb-4">📍</span>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Location Access Required</h2>
          <p className="text-gray-500 text-sm">{location.error}</p>
          <p className="text-gray-400 text-xs mt-2">
            Please enable location access in your browser settings and refresh the page.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 bg-[#5B5FE8] text-white px-6 py-2 rounded-lg hover:bg-[#4348c4] transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Main content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {location?.lat !== 0 && (
          <p className="text-sm text-indigo-600 mb-6 flex items-center gap-1.5">
            <span>📍</span>
            <span>{placeName ?? "Locating…"}</span>
          </p>
        )}

        <div className="grid grid-cols-1 gap-6">
          {/* Weather section */}
          <section>
            {loading.weather ? (
              <div className="bg-gradient-to-br from-[#5B5FE8] to-[#4348c4] rounded-2xl shadow-lg p-6 text-white animate-pulse">
                <div className="h-6 bg-white/20 rounded w-40 mb-3" />
                <div className="h-16 bg-white/20 rounded w-32 mb-3" />
                <div className="grid grid-cols-3 gap-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-white/10 rounded-xl p-3 h-16" />
                  ))}
                </div>
              </div>
            ) : errors.weather ? (
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-red-100">
                <p className="text-red-500 text-sm">⚠️ Weather error: {errors.weather}</p>
                <p className="text-gray-400 text-xs mt-1">
                  Make sure OPENWEATHER_API_KEY is set in your .env.local
                </p>
              </div>
            ) : weather ? (
              <WeatherCard data={weather} />
            ) : null}
          </section>

          {/* Calendar section */}
          <section>
            <CalendarCard
              events={calendar}
              loading={loading.calendar}
              error={errors.calendar}
            />
          </section>

          {/* Parks section */}
          <section>
            {loading.parks ? (
              <div className="bg-white rounded-2xl shadow-lg p-6 animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-40 mb-4" />
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-14 bg-gray-100 rounded-xl mb-3" />
                ))}
              </div>
            ) : errors.parks ? (
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-red-100">
                <p className="text-red-500 text-sm">⚠️ Parks error: {errors.parks}</p>
              </div>
            ) : (
              <ParksCard parks={parks} userLat={location?.lat || 0} userLon={location?.lon || 0} />
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
