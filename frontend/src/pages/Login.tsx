import { useState } from "react";
import { useAuth } from "../hook/useAuth";
import { useNavigate, Navigate } from "react-router";

export function Login() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);

    const { user, login, isLoading } = useAuth();
    const navigate = useNavigate();

    // 1. Handle the Login Action
    const handleLogin = async () => {
        if (!login) {
            alert("Login function is not available");
            return;
        }
        try {
            await login(username, password);
            navigate("/");
        } catch (error) {
            setError("Login failed. Please check your credentials and try again.");
            
        }
    };

    if (user) {
        return <Navigate to="/" replace />;
    }

    return (
        <div
            className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4 py-8 text-slate-100 sm:px-6"
            style={{ fontFamily: '"Sora", "Poppins", "Trebuchet MS", sans-serif' }}
        >
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute -left-24 top-8 h-56 w-56 rounded-full bg-cyan-500/20 blur-3xl" />
                <div className="absolute right-0 top-40 h-80 w-80 rounded-full bg-emerald-500/15 blur-3xl" />
                <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-amber-500/10 blur-3xl" />
            </div>

            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    handleLogin();
                }}
                className="relative z-10 w-full max-w-md rounded-3xl border border-white/10 bg-linear-to-r from-slate-900/90 via-slate-800/80 to-slate-900/85 p-8 shadow-2xl shadow-cyan-900/20 backdrop-blur"
            >
                <div className="mb-8">
                    <p className="text-center text-xs uppercase tracking-[0.3em] text-cyan-300">Blade compute</p>
                    <h1 className="mt-3 text-center text-3xl font-bold text-slate-100">Operations Login</h1>
                    <p className="mt-2 text-center text-sm text-slate-400">Sign in to access cluster telemetry.</p>
                </div>
                
                <div className="mb-6">
                    <label className="mb-2 block font-semibold text-slate-300">Username</label>
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-slate-100 placeholder-slate-500 transition focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
                        placeholder="Enter your username"
                        required
                    />
                </div>
                <div className="mb-6">
                    <label className="mb-2 block font-semibold text-slate-300">Password</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-slate-100 placeholder-slate-500 transition focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
                        placeholder="Enter your password"
                        required
                    />
                </div>
                {error && (
                    <div className="mb-4 rounded-lg border border-rose-400/25 bg-rose-950/40 p-3 text-sm text-rose-200">
                        {error}
                    </div>
                )}
                <button
                    type="submit"
                    className={`w-full rounded-lg px-4 py-3 font-semibold transition ${
                        isLoading 
                            ? "cursor-not-allowed bg-slate-500 text-slate-200"
                            : "cursor-pointer bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-900/20 hover:bg-cyan-400"
                    }`}
                    disabled={isLoading}
                >
                    {isLoading ? "Logging in..." : "Login"}
                </button>

                <p className="mt-6 text-center text-xs text-slate-500">
                    © 2026 Thaksin Chiaokon. All rights reserved.
                </p>
            </form>
        </div>
    );
}