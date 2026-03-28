interface Park {
  id: number;
  type: string;
  tags?: Record<string, string>;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
}

function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3;
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const dPhi = ((lat2 - lat1) * Math.PI) / 180;
  const dLambda = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dPhi / 2) * Math.sin(dPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(dLambda / 2) * Math.sin(dLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)}m`;
  return `${(meters / 1000).toFixed(1)}km`;
}

export default function ParksCard({
  parks,
  userLat,
  userLon,
}: {
  parks: Park[];
  userLat: number;
  userLon: number;
}) {
  const parksWithDistance = parks
    .map((park) => {
      const lat = park.lat ?? park.center?.lat;
      const lon = park.lon ?? park.center?.lon;
      const distance =
        lat && lon ? getDistance(userLat, userLon, lat, lon) : Infinity;
      return { ...park, lat, lon, distance };
    })
    .filter((p) => p.lat && p.lon)
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 10);

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-2xl">🌳</span>
        <h2 className="text-xl font-semibold text-gray-800">Nearby Parks</h2>
        <span className="ml-auto text-sm text-gray-400">{parksWithDistance.length} found</span>
      </div>

      {parksWithDistance.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <span className="text-4xl block mb-2">🔍</span>
          <p>No parks found within 5km</p>
        </div>
      ) : (
        <div className="space-y-3">
          {parksWithDistance.map((park) => {
            const name = park.tags?.name || park.tags?.["name:en"] || "Unnamed Park";
            const osmUrl = `https://www.openstreetmap.org/${park.type}/${park.id}`;
            return (
              <a
                key={park.id}
                href={osmUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-emerald-50 border border-gray-100 hover:border-emerald-200 transition-all group"
              >
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-xl flex-shrink-0">
                  🌿
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800 truncate group-hover:text-emerald-700">
                    {name}
                  </p>
                  {park.tags?.description && (
                    <p className="text-xs text-gray-400 truncate">{park.tags.description}</p>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="text-sm font-semibold text-emerald-600">
                    {formatDistance(park.distance)}
                  </span>
                  <p className="text-xs text-gray-400">away</p>
                </div>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
