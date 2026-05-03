const DEFAULT_API_BASE_URL = "http://10.42.7.254:8001";

export const API_BASE_URL = (
    import.meta.env.VITE_API_BASE_URL ?? DEFAULT_API_BASE_URL
).replace(/\/$/, "");

export function buildApiUrl(path: string, query?: Record<string, string>): string {
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    const base = `${API_BASE_URL}${normalizedPath}`;

    if (!query) {
        return base;
    }

    const queryString = new URLSearchParams(query).toString();
    return queryString ? `${base}?${queryString}` : base;
}
