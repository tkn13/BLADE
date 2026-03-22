import { useState, useMemo, useRef, useEffect } from "react"
import { useFetch } from "../hook/useFetch"
import { NodeCard } from "../components/NodeCard"

import { Loading } from "@/components/Loading"


interface NodeMetricData {
    node_id: string;
    node_status: "up" | "busy" | "dead";
    current_job: string[];
    total_mem: number;
    resource_usage: {
        start_time: string;
        end_time: string;
        data_amount: number;
        data: Array<{
            timestamp: string;
            cpu: number;
            mem: number;
        }>;
    };
}

export function Node() {

    const [searchQuery, setSearchQuery] = useState("");
    const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
    const isInitialLoad = useRef(true);

    const apikey_head = "648a4e670d379e9225ac45d61c6daf01"
    const url_option = {
        node_ids: "blade-n1,blade-n2,blade-n3,blade-n4,blade-n5,blade-n6,blade-n7,blade-n8",
        time_delta: "-5m"
    }
    const requestOptions = useMemo(() => ({
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "apikey": apikey_head
        },

    }), [apikey_head])

    /*
    this endpoint is designed to return an array of NodeMetricData
    e.g.
    [
        {
            "data_amount": 10,
            "start_time": "2024-06-01T12:00:00Z",
            "end_time": "2024-06-01T12:05:00Z",
            "resource_usage": {
                "data": [
                    {
                        "timestamp": "2024-06-01T12:00:00Z",
                        "cpu": 30,
                        "mem": 2048
                    },
                    ...
                ]
            }
        }
    ]
    */
    const baseUrl = "http://10.42.7.254:8001/api/metrics/node/batch" + "?" + new URLSearchParams(url_option).toString()
    
    const {data, isLoading} = useFetch<NodeMetricData[]>(baseUrl, requestOptions, 10000);

    useEffect(() => {
        if (!isLoading && data && isInitialLoad.current) {
            isInitialLoad.current = false;
            setHasLoadedOnce(true);
        }
    }, [isLoading, data]);


    const filteredData = useMemo(() => {
        if (!data) return [];
        return data.filter(item => item.node_id.toLowerCase().includes(searchQuery.toLowerCase()));
    }, [data, searchQuery]);  

    if (isLoading && !hasLoadedOnce) {
        return (
            <div className="h-screen flex items-center justify-center bg-slate-950">
                <Loading size="full" message="Loading nodes..." />
            </div>
        );
    }

    return (
        <div
            className="relative min-h-screen overflow-x-hidden bg-slate-950 text-slate-100"
            style={{ fontFamily: '"Sora", "Poppins", "Trebuchet MS", sans-serif' }}
        >
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute -left-24 top-8 h-56 w-56 rounded-full bg-cyan-500/20 blur-3xl" />
                <div className="absolute right-0 top-40 h-80 w-80 rounded-full bg-emerald-500/15 blur-3xl" />
                <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-amber-500/10 blur-3xl" />
            </div>

            <div className="relative flex flex-col">
                <div className="flex items-center justify-between bg-slate-950/90 backdrop-blur sticky top-0 z-10 px-6 py-4 border-b border-white/10">
                    <h1 className="text-2xl font-bold text-cyan-300">Compute Node</h1>
                    <form onSubmit={(e) => e.preventDefault()}>
                        <input
                            className="w-64 px-4 py-2 rounded-lg border border-white/20 bg-white/5 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20 transition-all placeholder-slate-500 text-slate-200"
                            type="text"
                            placeholder="Search node name..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </form>
                </div>
                <main className="grid grid-cols-3 px-2 py-4">
                    {filteredData.length > 0 ? (
                        filteredData.map((item) => (
                            <NodeCard
                                key={item.node_id}
                                cardTitle={item.node_id}
                                cardDetail={item.node_id}
                                cardState={item.node_status}
                                total_mem={item.total_mem}
                                chartData={item.resource_usage}
                            />
                        ))
                    ) : (
                        <p className="p-4 col-span-3 text-slate-400">No nodes found.</p>
                    )}
                </main>
            </div>
        </div>
    )
}