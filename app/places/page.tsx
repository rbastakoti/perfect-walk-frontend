"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { AppCache } from "@/lib/app-cache";

interface OSMPlace {
  id: string;
  name: string;
  lat: number;
  lon: number;
  distance: number;
  tags: Record<string, string>;
  typeLabel: string;
  typeCategory: string;
  description: string | null;
  imageUrl: string | null;
  wikiUrl: string | null;
  osmUrl: string;
}

const CATEGORIES = [
  { id: "all",         label: "All",          icon: "🗺️" },
  { id: "parks",       label: "Parks",        icon: "🌳" },
  { id: "attractions", label: "Attractions",  icon: "🏛️" },
];

const TYPE_ICONS: Record<string, string> = {
  restaurant: "🍽️", cafe: "☕", bar: "🍺", fast_food: "🍔", pub: "🍻",
  bakery: "🥐", food_court: "🍱",
  museum: "🏛️", theatre: "🎭", cinema: "🎬", nightclub: "🎵",
  arts_centre: "🎨", library: "📚", community_centre: "🏘️",
  pharmacy: "💊", hospital: "🏥", clinic: "🏥", dentist: "🦷",
  attraction: "⭐", gallery: "🎨", theme_park: "🎡", zoo: "🦁",
  aquarium: "🐠", viewpoint: "👁️", artwork: "🗿", hotel: "🏨",
  park: "🌳", fitness_centre: "💪", spa: "🧖", swimming_pool: "🏊",
  stadium: "🏟️", sports_centre: "⚽", golf_course: "⛳", bowling_alley: "🎳",
  mall: "🛍️", department_store: "🏪", clothes: "👗", books: "📚",
  electronics: "💻", supermarket: "🛒", market: "🏪", beauty: "💄",
  hairdresser: "✂️",
};

const CATEGORY_BADGE: Record<string, string> = {
  amenity: "bg-orange-100 text-orange-700",
  tourism: "bg-blue-100 text-blue-700",
  leisure: "bg-green-100 text-green-700",
  shop:    "bg-purple-100 text-purple-700",
  place:   "bg-gray-100 text-gray-600",
};

const CATEGORY_BG: Record<string, string> = {
  amenity: "from-orange-50 to-amber-100",
  tourism: "from-blue-50 to-indigo-100",
  leisure: "from-green-50 to-emerald-100",
  shop:    "from-purple-50 to-violet-100",
  place:   "from-gray-50 to-slate-100",
};

function formatDistance(m: number): string {
  const miles = m / 1609.34;
  if (miles < 0.1) return `${Math.round(m * 3.281)} ft`;
  return `${miles.toFixed(1)} mi`;
}

function getIcon(tags: Record<string, string>): string {
  for (const key of ["amenity", "tourism", "leisure", "shop"]) {
    if (tags[key] && TYPE_ICONS[tags[key]]) return TYPE_ICONS[tags[key]];
  }
  return "📍";
}

function PlaceCard({ place }: { place: OSMPlace }) {
  const icon = getIcon(place.tags);
  const badgeColor = CATEGORY_BADGE[place.typeCategory] ?? CATEGORY_BADGE.place;
  const bgGrad = CATEGORY_BG[place.typeCategory] ?? CATEGORY_BG.place;

  const cuisine = place.tags.cuisine?.replace(/_/g, " ").replace(/;/g, " · ");
  const openingHours = place.tags.opening_hours;
  const website = place.tags.website ?? place.tags["contact:website"];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md hover:border-indigo-200 transition-all group flex flex-col">
      {/* Photo / OSM map / gradient fallback */}
      <div className="relative h-44 overflow-hidden flex-shrink-0">
        {place.imageUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={place.imageUrl}
              alt={place.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = "none";
                const sib = e.currentTarget.nextSibling as HTMLElement | null;
                if (sib) sib.style.display = "block";
              }}
            />
            {/* OSM fallback shown if photo 404s */}
            <iframe
              src={`https://www.openstreetmap.org/export/embed.html?bbox=${place.lon-0.001},${place.lat-0.001},${place.lon+0.001},${place.lat+0.001}&layer=mapnik&marker=${place.lat},${place.lon}`}
              title={place.name}
              className="absolute inset-0 w-full h-full border-0"
              loading="lazy"
              style={{ display: "none" }}
            />
          </>
        ) : (
          /* No photo — show live OSM map, bbox ±0.001° ≈ street level */
          <iframe
            src={`https://www.openstreetmap.org/export/embed.html?bbox=${place.lon-0.001},${place.lat-0.001},${place.lon+0.001},${place.lat+0.001}&layer=mapnik&marker=${place.lat},${place.lon}`}
            title={place.name}
            className="absolute inset-0 w-full h-full border-0"
            loading="lazy"
          />
        )}
        {/* Distance badge */}
        <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm text-indigo-700 text-xs font-bold px-2 py-1 rounded-full shadow-sm">
          {formatDistance(place.distance)}
        </div>
      </div>

      {/* Info */}
      <div className="p-4 flex flex-col flex-1">
        {/* Type + cuisine */}
        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badgeColor}`}>
            {place.typeLabel}
          </span>
          {cuisine && (
            <span className="text-xs text-gray-400 capitalize">{cuisine}</span>
          )}
        </div>

        {/* Name */}
        <h3 className="font-semibold text-gray-800 text-base leading-tight mb-1.5 group-hover:text-indigo-700 transition-colors line-clamp-2">
          {place.name}
        </h3>

        {/* Description */}
        {place.description && (
          <p className="text-xs text-gray-500 line-clamp-3 leading-relaxed mb-2">
            {place.description}
          </p>
        )}

        {/* Opening hours */}
        {openingHours && (
          <p className="text-xs text-gray-400 mb-1.5 truncate">
            🕐 {openingHours}
          </p>
        )}

        {/* Links */}
        <div className="flex gap-3 mt-auto pt-2.5 border-t border-gray-50">
          <a
            href={place.osmUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-indigo-500 hover:text-indigo-700 font-medium"
          >
            OpenStreetMap →
          </a>
          {place.wikiUrl && (
            <a
              href={place.wikiUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-gray-400 hover:text-gray-600 font-medium"
            >
              Wikipedia →
            </a>
          )}
          {website && (
            <a
              href={website.startsWith("http") ? website : `https://${website}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-gray-400 hover:text-gray-600 font-medium"
            >
              Website →
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-pulse">
      <div className="h-44 bg-gray-100" />
      <div className="p-4 space-y-2.5">
        <div className="h-3 bg-gray-100 rounded-full w-1/4" />
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gray-100 rounded w-full" />
        <div className="h-3 bg-gray-100 rounded w-2/3" />
        <div className="h-3 bg-gray-100 rounded w-1/2" />
      </div>
    </div>
  );
}

export default function PlacesPage() {
  const { status } = useSession();
  const router = useRouter();
  const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [placeName, setPlaceName] = useState<string | null>(null);
  const [locationError, setLocationError] = useState("");
  const [category, setCategory] = useState("all");
  const [places, setPlaces] = useState<OSMPlace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") router.push("/");
  }, [status, router]);

  // Use cached location from /init — no geolocation prompt needed
  useEffect(() => {
    const cached = AppCache.get<{ lat: number; lon: number }>("location");
    if (cached) {
      setLocation(cached);
      // Reverse-geocode for the display name (lightweight, cached separately)
      const cachedName = AppCache.get<string>("place-name");
      if (cachedName) {
        setPlaceName(cachedName);
      } else {
        fetch(`https://nominatim.openstreetmap.org/reverse?lat=${cached.lat}&lon=${cached.lon}&format=json`)
          .then(r => r.json())
          .then(d => {
            const a = d.address ?? {};
            const name = [a.suburb ?? a.neighbourhood ?? a.city_district, a.city ?? a.town ?? a.village]
              .filter(Boolean).join(", ");
            const display = name || d.display_name?.split(",")[0] || null;
            if (display) { setPlaceName(display); AppCache.set("place-name", display); }
          })
          .catch(() => {});
      }
    } else if (navigator.geolocation) {
      // Fallback if /init was skipped
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = { lat: pos.coords.latitude, lon: pos.coords.longitude };
          setLocation(loc);
          AppCache.set("location", loc);
        },
        (err) => { setLocationError(err.message); setLoading(false); },
        { timeout: 8000 }
      );
    } else {
      setLocationError("Geolocation not supported.");
      setLoading(false);
    }
  }, []);

  const fetchPlaces = useCallback((cat: string) => {
    if (!location) return;

    // Cache hit — instant render (only use cache if it has results)
    const cacheKey = `places-${cat}`;
    const cached = AppCache.get<OSMPlace[]>(cacheKey);
    if (cached && cached.length > 0) {
      setPlaces(cached);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 35000); // 35s > 3×10s server timeout

    fetch(`/api/places?lat=${location.lat}&lon=${location.lon}&category=${cat}`, { signal: controller.signal })
      .then(r => r.json())
      .then(data => {
        clearTimeout(timer);
        if (data.error) throw new Error(data.error);
        const results = data.places ?? [];
        if (results.length > 0) AppCache.set(cacheKey, results);
        setPlaces(results);
      })
      .catch(e => { if (e.name !== "AbortError") setError(e.message); })
      .finally(() => setLoading(false));
  }, [location]);

  useEffect(() => { fetchPlaces(category); }, [location, fetchPlaces, category]);

  if (status === "loading") {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4 animate-bounce">📍</div>
          <p className="text-indigo-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (locationError) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md mx-4 text-center">
          <span className="text-5xl block mb-4">📍</span>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Location Access Required</h2>
          <p className="text-gray-500 text-sm">{locationError}</p>
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
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Nearby Places</h1>
        {location && (
          <p className="text-sm text-indigo-500 mt-1 flex items-center gap-1.5">
            <span>📍</span>
            <span>{placeName ?? "Locating…"}</span>
            <span className="text-gray-300">·</span>
            <span className="text-gray-400">within 5 mi</span>
          </p>
        )}
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 flex-wrap mb-6">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setCategory(cat.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all ${
              category === cat.id
                ? "bg-indigo-600 text-white shadow-md"
                : "bg-white text-gray-600 border border-gray-200 hover:border-indigo-300 hover:text-indigo-600"
            }`}
          >
            <span>{cat.icon}</span>
            {cat.label}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-red-100 mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-1">
            <p className="font-semibold text-gray-800 text-sm mb-0.5">Could not load places</p>
            <p className="text-xs text-gray-400">The map data service is slow or unreachable. Try again — it usually works on the second attempt.</p>
          </div>
          <button
            onClick={() => fetchPlaces(category)}
            className="shrink-0 rounded-xl px-4 py-2 text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95"
            style={{ background: "linear-gradient(135deg, #6367FF, #8494FF)" }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : places.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <span className="text-5xl block mb-3">🔍</span>
          <p className="font-medium">No places found nearby</p>
          <p className="text-sm mt-1">Try a different category</p>
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-400 mb-4">{places.length} places found via OpenStreetMap</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {places.map((place) => <PlaceCard key={place.id} place={place} />)}
          </div>
        </>
      )}
    </div>
  );
}
