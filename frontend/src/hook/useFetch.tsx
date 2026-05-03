import { useEffect, useMemo, useState } from "react";

interface FetchState<T> {
    data: T | null;
    isLoading: boolean;
    error: string | null;
}

export function useFetch<T>(
    url: string,
    options?: {
        method?: string;
        headers?: Record<string, string>;
        body?: BodyInit;
    },
    refetchIntervalMs?: number
): FetchState<T> {

    const [data, setData] = useState<T | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const requestMethod = useMemo(() => options?.method ?? "GET", [options?.method]);
    const requestHeaders = useMemo(() => options?.headers, [JSON.stringify(options?.headers ?? {})]);
    const requestBody = useMemo(() => options?.body, [typeof options?.body === "string" ? options.body : null]);

    useEffect( () => {
        let isActive = true;
        let abortController: AbortController | null = null;

        const fetchData = async () => {
            abortController?.abort();
            abortController = new AbortController();
            setIsLoading(true);

            try {

                console.log("Fetching data from:", url);

                const response = await fetch(url, {
                    method: requestMethod,
                    headers: requestHeaders,
                    body: requestBody,
                    signal: abortController.signal
                });

                if (!response.ok) {
                    throw new Error(`Request failed with status ${response.status}`);
                }

                const result = await response.json() as T;

                console.log("Fetch response:", response);

                if (!isActive) return;
                setData(result);
                setError(null);

            } catch (err: any) {
                if (!isActive) return;
                console.error("Fetch error:", err);
                if (err.name !== 'AbortError'){
                    setError(err.message || "Something went wrong");
                }
            } finally {
                if (!isActive) return;
                setIsLoading(false);
            }
        };

        fetchData();

        const shouldPoll = Boolean(refetchIntervalMs && refetchIntervalMs > 0);

        if (!shouldPoll) {
            return () => {
                isActive = false;
                abortController?.abort();
            };
        }

        const intervalId = window.setInterval(fetchData, refetchIntervalMs);

        return () => {
            isActive = false;
            window.clearInterval(intervalId);
            abortController?.abort();
        };
    }, [url, requestMethod, requestHeaders, requestBody, refetchIntervalMs]);

    return {data, isLoading, error};
}