interface WeatherData {
  name: string;
  sys: { country: string };
  main: {
    temp: number;
    feels_like: number;
    humidity: number;
    temp_min: number;
    temp_max: number;
  };
  weather: Array<{ description: string; icon: string; main: string }>;
  wind: { speed: number; deg: number };
  visibility: number;
}

function getWeatherEmoji(main: string): string {
  const map: Record<string, string> = {
    Clear: "☀️",
    Clouds: "☁️",
    Rain: "🌧️",
    Drizzle: "🌦️",
    Thunderstorm: "⛈️",
    Snow: "❄️",
    Mist: "🌫️",
    Fog: "🌫️",
    Haze: "🌫️",
  };
  return map[main] || "🌡️";
}

export default function WeatherCard({ data }: { data: WeatherData }) {
  const w = data.weather[0];
  const emoji = getWeatherEmoji(w.main);

  return (
    <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl shadow-lg p-6 text-white">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-semibold opacity-90">Current Weather</h2>
          <p className="text-blue-200 text-sm mt-0.5">
            {data.name}, {data.sys.country}
          </p>
        </div>
        <span className="text-5xl">{emoji}</span>
      </div>

      <div className="mt-4">
        <span className="text-6xl font-bold">{Math.round(data.main.temp)}°</span>
        <span className="text-2xl text-blue-200 ml-1">C</span>
      </div>

      <p className="mt-1 capitalize text-blue-100">{w.description}</p>

      <div className="mt-4 grid grid-cols-3 gap-3">
        <div className="bg-blue-600/50 rounded-xl p-3 text-center">
          <p className="text-blue-200 text-xs">Feels Like</p>
          <p className="font-semibold text-sm mt-0.5">{Math.round(data.main.feels_like)}°C</p>
        </div>
        <div className="bg-blue-600/50 rounded-xl p-3 text-center">
          <p className="text-blue-200 text-xs">Humidity</p>
          <p className="font-semibold text-sm mt-0.5">{data.main.humidity}%</p>
        </div>
        <div className="bg-blue-600/50 rounded-xl p-3 text-center">
          <p className="text-blue-200 text-xs">Wind</p>
          <p className="font-semibold text-sm mt-0.5">{data.wind.speed} m/s</p>
        </div>
      </div>

      <div className="mt-3 flex justify-between text-sm text-blue-200">
        <span>H: {Math.round(data.main.temp_max)}°C</span>
        <span>L: {Math.round(data.main.temp_min)}°C</span>
        <span>Visibility: {(data.visibility / 1000).toFixed(1)} km</span>
      </div>
    </div>
  );
}
