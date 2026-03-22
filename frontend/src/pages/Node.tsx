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

const EMPTY_CHART_DATA: NodeMetricData = {
    node_id: "",
    node_status: "dead",
    current_job: [],
    total_mem: 0,
    resource_usage: {
        start_time: "",
        end_time: "",
        data_amount: 0,
        data: []
    }
};

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

    

    return (
        <div className="flex flex-col">
            <div className="flex items-center justify-between bg-background sticky top-0 z-10 p-4 shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold text-indigo-600">Compute Node</h1>
                </div>
                <form onSubmit={(e) => e.preventDefault()}>
                    <input
                        className="w-full px-4 py-2 rounded-lg border border-indigo-300 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-all placeholder-gray-500 text-gray-700 bg-white hover:shadow-md"
                        type="text"
                        placeholder="Search node name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </form>
            </div>
            {isLoading && !hasLoadedOnce ? (
                <div className="h-screen flex items-center justify-center">
                    <Loading size="full" message="Loading nodes..." />
                </div>
            ) : (
                <main className="grid grid-cols-3">
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
                        <p className="p-4 col-span-3 text-gray-500">No nodes found.</p>
                    )}
                </main>
            )}
        </div>
    )
}