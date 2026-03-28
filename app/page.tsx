import { auth, signIn } from "@/auth";
import { redirect } from "next/navigation";

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100">
      <div className="bg-white rounded-2xl shadow-xl p-10 flex flex-col items-center gap-8 max-w-md w-full mx-4">
        <div className="flex flex-col items-center gap-2">
          <span className="text-5xl">🌳</span>
          <h1 className="text-3xl font-bold text-emerald-800">Perfect Walk</h1>
          <p className="text-gray-500 text-center text-sm">
            Discover nearby parks and check the weather for your perfect walk.
          </p>
        </div>

        <div className="w-full border-t border-gray-100" />

        <form
          action={async () => {
            "use server";
            await signIn("google", { redirectTo: "/dashboard" });
          }}
          className="w-full"
        >
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 text-gray-700 font-medium py-3 px-6 rounded-xl shadow-sm hover:shadow-md hover:bg-gray-50 transition-all duration-200"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Sign in with Google
          </button>
        </form>

        <div className="w-full flex items-center gap-3">
          <div className="flex-1 border-t border-gray-100" />
          <span className="text-xs text-gray-400">or test login</span>
          <div className="flex-1 border-t border-gray-100" />
        </div>

        <form
          action={async (formData: FormData) => {
            "use server";
            await signIn("credentials", {
              email: formData.get("email"),
              password: formData.get("password"),
              redirectTo: "/dashboard",
            });
          }}
          className="w-full flex flex-col gap-3"
        >
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-700">
            <strong>Test credentials:</strong> test@example.com / password
          </div>
          <input
            name="email"
            type="email"
            defaultValue="test@example.com"
            placeholder="Email"
            required
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
          />
          <input
            name="password"
            type="password"
            defaultValue="password"
            placeholder="Password"
            required
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
          />
          <button
            type="submit"
            className="w-full bg-emerald-600 text-white font-medium py-3 px-6 rounded-xl hover:bg-emerald-700 transition-colors"
          >
            Sign in (Test)
          </button>
        </form>

        <p className="text-xs text-gray-400 text-center">
          By signing in, you agree to allow location access for park recommendations.
        </p>
      </div>
    </main>
  );
}
