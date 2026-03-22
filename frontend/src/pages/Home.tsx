import { useMemo } from "react";
import { Activity, Cpu, HardDrive, Server, ShieldCheck } from "lucide-react";
import {
    CartesianGrid,
    Cell,
    Legend,
    Line,
    LineChart,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip as ReTooltip,
    XAxis,
    YAxis,
} from "recharts";

import { Loading } from "@/components/Loading";
import { useFetch } from "@/hook/useFetch";
import { useAuth } from "@/hook/useAuth";

interface NodeMetricData {
    node_id: string;
    node_status: "up" | "busy" | "dead";
    total_mem: number;
    resource_usage: {
        data: Array<{
            timestamp: string;
            cpu: number;
            mem: number;
        }>;
    };
}

interface JobDetailResponse {
    jobId: string;
    jobName: string;
    user: string;
    jobStatus: string;
    nodeAlloc: string;
    cpuAlloc: number;
    time: string;
}

interface JobResponse {
    jobTotal: number;
    runningJob: number;
    pendingJob: number;
    jobDetail: JobDetailResponse[];
}

const NODE_COLORS: Record<"up" | "busy" | "dead", string> = {
    up: "#23B26D",
    busy: "#F2A541",
    dead: "#E04F5F",
};

const APIS = {
    key: "648a4e670d379e9225ac45d61c6daf01",
    node:
        "http://10.42.7.254:8001/api/metrics/node/batch?" +
        new URLSearchParams({
            node_ids: "blade-n1,blade-n2,blade-n3,blade-n4,blade-n5,blade-n6,blade-n7,blade-n8",
            time_delta: "-5m",
        }).toString(),
    job: "http://10.42.7.254:8001/api/metrics/job",
};

function formatClockLabel(raw: string | undefined): string {
    if (!raw) return "-";
    if (raw.length >= 16) {
        return raw.slice(11, 16);
    }
    return raw;
}

export function Home() {
    const { user } = useAuth();

    const requestOptions = useMemo(
        () => ({
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                apikey: APIS.key,
            },
        }),
        []
    );

    const {
        data: nodeData,
        isLoading: nodeLoading,
        error: nodeError,
    } = useFetch<NodeMetricData[]>(APIS.node, requestOptions, 10000);

    const {
        data: jobData,
        isLoading: jobLoading,
        error: jobError,
    } = useFetch<JobResponse>(APIS.job, requestOptions, 5000);

    const cluster = useMemo(() => {
        const nodes = nodeData ?? [];
        const upNodes = nodes.filter((node) => node.node_status === "up").length;
        const busyNodes = nodes.filter((node) => node.node_status === "busy").length;
        const deadNodes = nodes.filter((node) => node.node_status === "dead").length;
        const onlineNodes = upNodes + busyNodes;

        const latestUsage = nodes
            .map((node) => {
                const current = node.resource_usage.data.at(-1);
                if (!current || node.total_mem <= 0) return null;
                const memPercent = (current.mem / node.total_mem) * 100;
                return { cpu: current.cpu, memPercent };
            })
            .filter((item): item is { cpu: number; memPercent: number } => item !== null);
        
            console.log("Latest resource usage samples:", latestUsage);

        const avgCpu =
            latestUsage.length > 0
                ? latestUsage.reduce((sum, item) => sum + item.cpu, 0) / (onlineNodes > 0 ? onlineNodes : 1) 
                : 0;
        const avgMem =
            latestUsage.length > 0
                ? latestUsage.reduce((sum, item) => sum + item.memPercent, 0) / latestUsage.length
                : 0;

        const utilization = 
            latestUsage.length > 0
                ? latestUsage.reduce((sum, item) => sum + item.cpu, 0) / (onlineNodes > 0 ? onlineNodes : 1)
                : 0;

        return {
            onlineNodes,
            upNodes,
            busyNodes,
            deadNodes,
            avgCpu,
            avgMem,
            utilization,
            runningJob: jobData?.runningJob ?? 0,
            pendingJob: jobData?.pendingJob ?? 0,
            jobTotal: jobData?.jobTotal ?? 0,
        };
    }, [nodeData, jobData]);

    const nodeStateData = useMemo(
        () => [
            { name: "Ready", value: cluster.upNodes, color: NODE_COLORS.up },
            { name: "Busy", value: cluster.busyNodes, color: NODE_COLORS.busy },
            { name: "Offline", value: cluster.deadNodes, color: NODE_COLORS.dead },
        ],
        [cluster.upNodes, cluster.busyNodes, cluster.deadNodes]
    );

    const trendData = useMemo(() => {
        const nodes = nodeData ?? [];
        if (nodes.length === 0) return [];

        const maxPoints = Math.max(
            ...nodes.map((node) => node.resource_usage?.data?.length ?? 0),
            0
        );

        const timeline: Array<{ time: string; cpu: number; mem: number }> = [];

        for (let index = 0; index < maxPoints; index += 1) {
            const samples = nodes
                .map((node) => {
                    const point = node.resource_usage.data[index];
                    if (!point || node.total_mem <= 0) return null;
                    return {
                        time: point.timestamp,
                        cpu: point.cpu,
                        memPercent: (point.mem / node.total_mem) * 100,
                    };
                })
                .filter(
                    (item): item is { time: string; cpu: number; memPercent: number } => item !== null
                );

            if (samples.length === 0) continue;

            timeline.push({
                time: formatClockLabel(samples[0].time),
                cpu: samples.reduce((sum, point) => sum + point.cpu, 0) / samples.length,
                mem: samples.reduce((sum, point) => sum + point.memPercent, 0) / samples.length,
            });
        }

        return timeline;
    }, [nodeData]);

    const recentJobs = useMemo(() => (jobData?.jobDetail ?? []).slice(0, 6), [jobData]);

    const isInitialLoading = (nodeLoading && !nodeData) || (jobLoading && !jobData);

    if (isInitialLoading) {
        return (
            <div className="h-screen flex items-center justify-center">
                <Loading size="full" message="Building cluster dashboard..." />
            </div>
        );
    }

    return (
        <main
            className="relative min-h-screen overflow-x-hidden bg-slate-950 px-4 py-6 text-slate-100 sm:px-6 lg:px-8"
            style={{ fontFamily: '"Sora", "Poppins", "Trebuchet MS", sans-serif' }}
        >
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute -left-24 top-8 h-56 w-56 rounded-full bg-cyan-500/20 blur-3xl" />
                <div className="absolute right-0 top-40 h-80 w-80 rounded-full bg-emerald-500/15 blur-3xl" />
                <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-amber-500/10 blur-3xl" />
            </div>

            <section className="relative rounded-3xl border border-white/10 bg-gradient-to-r from-slate-900/90 via-slate-800/80 to-slate-900/85 p-6 shadow-2xl shadow-cyan-900/20">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">BLADE Compute</p>
                        <h1 className="mt-2 text-3xl font-bold leading-tight sm:text-4xl">
                            Live Operations Center
                        </h1>
                        <p className="mt-3 max-w-2xl text-sm text-slate-300 sm:text-base">
                            Welcome {user ?? "operator"}. Here's the current status of your compute cluster.
                        </p>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-right text-sm sm:grid-cols-2 lg:min-w-[380px]">
                        <div className="rounded-xl border border-amber-300/25 bg-amber-500/10 p-3">
                            <p className="text-amber-100">Utilization</p>
                            <p className="text-2xl font-semibold text-amber-50">{cluster.utilization.toFixed(0)}%</p>
                        </div>
                        <div className="rounded-xl border border-cyan-300/25 bg-cyan-500/10 p-3 col-span-2 sm:col-span-1">
                            <p className="text-cyan-100">Running Jobs</p>
                            <p className="text-2xl font-semibold text-cyan-50">{cluster.runningJob}</p>
                        </div>
                    </div>
                </div>
            </section>

            <section className="relative mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <article className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-sm uppercase tracking-wider text-slate-300">Nodes Online</h2>
                        <Server className="h-5 w-5 text-cyan-300" />
                    </div>
                    <p className="text-3xl font-bold">{cluster.onlineNodes}</p>
                    <p className="mt-2 text-xs text-slate-400">{cluster.deadNodes} offline now</p>
                </article>

                <article className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-sm uppercase tracking-wider text-slate-300">Average CPU</h2>
                        <Cpu className="h-5 w-5 text-emerald-300" />
                    </div>
                    <p className="text-3xl font-bold">{cluster.avgCpu.toFixed(1)}%</p>
                    <p className="mt-2 text-xs text-slate-400">Cross-cluster live average</p>
                </article>

                <article className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-sm uppercase tracking-wider text-slate-300">Average Memory</h2>
                        <HardDrive className="h-5 w-5 text-amber-300" />
                    </div>
                    <p className="text-3xl font-bold">{cluster.avgMem.toFixed(1)}%</p>
                    <p className="mt-2 text-xs text-slate-400">Memory saturation level</p>
                </article>

                <article className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-sm uppercase tracking-wider text-slate-300">Queue Pressure</h2>
                        <Activity className="h-5 w-5 text-rose-300" />
                    </div>
                    <p className="text-3xl font-bold">
                        {cluster.pendingJob}
                        <span className="ml-2 text-base text-slate-400">pending</span>
                    </p>
                    <p className="mt-2 text-xs text-slate-400">{cluster.jobTotal} total tracked jobs</p>
                </article>
            </section>

            <section className="relative mt-6 grid gap-5 xl:grid-cols-5">
                <article className="rounded-2xl border border-white/10 bg-slate-900/70 p-5 xl:col-span-2">
                    <div className="mb-2 flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-slate-100">Node State Spread</h3>
                        <ShieldCheck className="h-5 w-5 text-cyan-300" />
                    </div>
                    <p className="mb-4 text-sm text-slate-400">Distribution of ready, busy, and offline nodes.</p>

                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={nodeStateData}
                                    dataKey="value"
                                    nameKey="name"
                                    innerRadius={66}
                                    outerRadius={100}
                                    paddingAngle={5}
                                >
                                    {nodeStateData.map((entry) => (
                                        <Cell key={entry.name} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Legend wrapperStyle={{ color: "#cbd5e1", fontSize: "13px" }} />
                                <ReTooltip
                                    formatter={(value) => [value, "nodes"]}
                                    contentStyle={{
                                        backgroundColor: "#0f172a",
                                        border: "1px solid rgba(148,163,184,0.25)",
                                        borderRadius: "10px",
                                    }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </article>

                <article className="rounded-2xl border border-white/10 bg-slate-900/70 p-5 xl:col-span-3">
                    <h3 className="text-lg font-semibold text-slate-100">Resource Trend (5-minute window)</h3>
                    <p className="mb-4 text-sm text-slate-400">
                        Cluster-average CPU and memory percentage over recent samples.
                    </p>

                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={trendData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                                <XAxis dataKey="time" stroke="#94a3b8" />
                                <YAxis domain={[0, 100]} stroke="#94a3b8" unit="%" />
                                <ReTooltip
                                    contentStyle={{
                                        backgroundColor: "#0f172a",
                                        border: "1px solid rgba(148,163,184,0.25)",
                                        borderRadius: "10px",
                                    }}
                                />
                                <Legend />
                                <Line
                                    type="monotone"
                                    dataKey="cpu"
                                    stroke="#22d3ee"
                                    strokeWidth={2.5}
                                    dot={false}
                                    name="CPU Avg"
                                />
                                <Line
                                    type="monotone"
                                    dataKey="mem"
                                    stroke="#fbbf24"
                                    strokeWidth={2.5}
                                    dot={false}
                                    name="Memory Avg"
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </article>
            </section>

            <section className="relative mt-6 rounded-2xl border border-white/10 bg-slate-900/70 p-5">
                <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <h3 className="text-lg font-semibold text-slate-100">Latest Jobs</h3>
                    <span className="text-xs uppercase tracking-widest text-slate-400">
                        Auto-refresh every 5s
                    </span>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full text-left text-sm">
                        <thead>
                            <tr className="border-b border-white/10 text-slate-300">
                                <th className="px-3 py-2 font-medium">Job ID</th>
                                <th className="px-3 py-2 font-medium">Name</th>
                                <th className="px-3 py-2 font-medium">User</th>
                                <th className="px-3 py-2 font-medium">Status</th>
                                <th className="px-3 py-2 font-medium">Node</th>
                                <th className="px-3 py-2 font-medium text-right">CPU</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentJobs.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-3 py-6 text-center text-slate-400">
                                        No job records available.
                                    </td>
                                </tr>
                            )}

                            {recentJobs.map((job, idx) => (
                                <tr
                                    key={job.jobId}
                                    className={idx % 2 === 0 ? "bg-white/[0.03]" : "bg-transparent"}
                                >
                                    <td className="px-3 py-2 font-semibold text-slate-100">{job.jobId}</td>
                                    <td className="px-3 py-2 text-slate-300">{job.jobName}</td>
                                    <td className="px-3 py-2 text-slate-300">{job.user}</td>
                                    <td className="px-3 py-2">
                                        <span
                                            className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                                                job.jobStatus === "RUNNING"
                                                    ? "bg-emerald-500/20 text-emerald-300"
                                                    : job.jobStatus === "FAILED"
                                                      ? "bg-rose-500/20 text-rose-300"
                                                      : "bg-amber-500/20 text-amber-300"
                                            }`}
                                        >
                                            {job.jobStatus}
                                        </span>
                                    </td>
                                    <td className="px-3 py-2 text-slate-300">{job.nodeAlloc}</td>
                                    <td className="px-3 py-2 text-right text-slate-200">{job.cpuAlloc}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            {(nodeError || jobError) && (
                <section className="relative mt-6 rounded-xl border border-rose-400/25 bg-rose-950/40 p-4 text-sm text-rose-200">
                    Partial data issue: {nodeError ? `node API: ${nodeError}` : ""}
                    {nodeError && jobError ? " | " : ""}
                    {jobError ? `job API: ${jobError}` : ""}
                </section>
            )}
        </main>
    );
}