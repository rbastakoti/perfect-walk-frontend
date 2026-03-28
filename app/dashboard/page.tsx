"use client";

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import WeatherCard from "@/components/WeatherCard";
import ParksCard from "@/components/ParksCard";

interface LocationState {
  lat: number;
  lon: number;
  error?: string;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [location, setLocation] = useState<LocationState | null>(null);
  const [weather, setWeather] = useState<any>(null);
  const [parks, setParks] = useState<any[]>([]);
  const [loading, setLoading] = useState({ location: true, weather: false, parks: false });
  const [errors, setErrors] = useState({ weather: "", parks: "" });

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
      },
      (err) => {
        setLocation({ lat: 0, lon: 0, error: err.message });
        setLoading((l) => ({ ...l, location: false }));
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100">
        <div className="text-center">
          <div className="text-5xl mb-4 animate-bounce">🌳</div>
          <p className="text-emerald-700 font-medium">
            {loading.location ? "Accessing your location..." : "Loading..."}
          </p>
        </div>
      </div>
    );
  }

  if (location?.error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md mx-4 text-center">
          <span className="text-5xl block mb-4">📍</span>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Location Access Required</h2>
          <p className="text-gray-500 text-sm">{location.error}</p>
          <p className="text-gray-400 text-xs mt-2">
            Please enable location access in your browser settings and refresh the page.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🌳</span>
            <h1 className="text-xl font-bold text-emerald-800">Perfect Walk</h1>
          </div>
          <div className="flex items-center gap-3">
            {session?.user?.image && (
              <img
                src={session.user.image}
                alt={session.user.name || "User"}
                className="w-8 h-8 rounded-full border-2 border-emerald-200"
              />
            )}
            <span className="text-sm text-gray-600 hidden sm:block">
              {session?.user?.name}
            </span>
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="text-sm text-gray-500 hover:text-red-500 transition-colors px-3 py-1 rounded-lg hover:bg-red-50"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {location?.lat !== 0 && (
          <p className="text-sm text-emerald-700 mb-6 flex items-center gap-1.5">
            <span>📍</span>
            <span>
              {location?.lat.toFixed(4)}, {location?.lon.toFixed(4)}
            </span>
          </p>
        )}

        <div className="grid grid-cols-1 gap-6">
          {/* Weather section */}
          <section>
            {loading.weather ? (
              <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl shadow-lg p-6 text-white animate-pulse">
                <div className="h-6 bg-blue-400 rounded w-40 mb-3" />
                <div className="h-16 bg-blue-400 rounded w-32 mb-3" />
                <div className="grid grid-cols-3 gap-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-blue-600/50 rounded-xl p-3 h-16" />
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
