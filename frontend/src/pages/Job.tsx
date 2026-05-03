import { useEffect, useMemo, useRef, useState } from "react"
import { Table, TableCaption, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"
import { useFetch } from "@/hook/useFetch"
import { Loading } from "@/components/Loading"
import { useAuth } from "@/hook/useAuth"
import { buildApiUrl } from "@/lib/api"

interface JobDetailResponse{
    jobId: string
    jobName: string
    user: string
    jobStatus: string
    nodeAlloc: string
    cpuAlloc: number
    time: string

}

interface JobResponse{
    jobTotal: number
    runningJob: number
    pendingJob: number
    jobDetail: JobDetailResponse[]
}



export function Job(){

    const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
    const isInitialLoad = useRef(true);

    const { apiKey } = useAuth();
    const requestOptions = useMemo(() => ({
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "apikey": apiKey ?? ""
        },
    }), [apiKey]);

    const baseurl = buildApiUrl("/api/metrics/job")

    const { data, error, isLoading } = useFetch<JobResponse>(baseurl, requestOptions, 5000);

    useEffect(() => {
        if (!isLoading && data && isInitialLoad.current) {
            isInitialLoad.current = false;
            setHasLoadedOnce(true);
        }
    }, [isLoading, data]);

    const [currentPage, setCurrentPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState("");
    const LIMIT_ROW = 10;

    const allJobs = data?.jobDetail ?? [];
    const filteredJobs = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        if (!query) {
            return allJobs;
        }

        return allJobs.filter((job) =>
            [job.jobId, job.jobName, job.user, job.jobStatus, job.nodeAlloc]
                .join(" ")
                .toLowerCase()
                .includes(query)
        );
    }, [allJobs, searchQuery]);

    const totalJobs = filteredJobs.length;
    const MAX_PAGE = Math.max(1, Math.ceil(totalJobs / LIMIT_ROW));

    const incress = ()=>{
        setCurrentPage(prevCurrentPage => Math.min(prevCurrentPage + 1, MAX_PAGE))
    }

    const decress = ()=>{
        setCurrentPage(prevCurrentPage => Math.max(prevCurrentPage - 1, 1))
    }

    const displayedData = filteredJobs.slice((currentPage - 1) * LIMIT_ROW, currentPage * LIMIT_ROW);

    if (isLoading && !hasLoadedOnce) {
        return (
            <div className="h-screen flex items-center justify-center bg-slate-950">
                <Loading size="full" message="Loading jobs..." />
            </div>
        );
    }

    if (error) {
        return <div className="min-h-screen bg-slate-950 p-6 text-rose-400">Failed to load jobs.</div>;
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

                <div className="relative flex items-center justify-between bg-slate-950/90 backdrop-blur sticky top-0 z-10 px-6 py-4 border-b border-white/10">
                    <h1 className="text-2xl font-bold text-cyan-300">Job Table</h1>
                    <form onSubmit={(e) => e.preventDefault()}>
                        <input
                            className="w-64 px-4 py-2 rounded-lg border border-white/20 bg-white/5 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20 transition-all placeholder-slate-500 text-slate-200"
                            type="text"
                            placeholder="Search by id, name, user, status, node"
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setCurrentPage(1);
                            }}
                        />
                    </form>
                </div>

                <div className="relative mx-auto max-w-7xl space-y-6 p-6">

                    <section className="grid gap-4 md:grid-cols-3">
                        <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                            <p className="text-sm uppercase tracking-wider text-slate-300">Total Jobs</p>
                            <p className="mt-2 text-3xl font-semibold text-slate-100">{data?.jobTotal ?? 0}</p>
                        </div>
                        <div className="rounded-xl border border-emerald-300/25 bg-emerald-500/10 p-4 backdrop-blur">
                            <p className="text-sm uppercase tracking-wider text-emerald-300">Running Jobs</p>
                            <p className="mt-2 text-3xl font-semibold text-emerald-100">{data?.runningJob ?? 0}</p>
                        </div>
                        <div className="rounded-xl border border-amber-300/25 bg-amber-500/10 p-4 backdrop-blur">
                            <p className="text-sm uppercase tracking-wider text-amber-300">Pending Jobs</p>
                            <p className="mt-2 text-3xl font-semibold text-amber-100">{data?.pendingJob ?? 0}</p>
                        </div>
                    </section>

                    <section className="rounded-2xl border border-white/10 bg-slate-900/70 p-5">
                        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <h2 className="text-lg font-semibold text-slate-100">Job Table</h2>
                            <div className="text-sm text-slate-400">Track queue status and inspect all job details from the API.</div>
                </div>

                        <div className="overflow-hidden rounded-xl border border-white/10">
                            <Table className="min-w-full text-sm">
                            <TableCaption className="text-left text-slate-400 mb-2">
                                Showing jobs {totalJobs === 0 ? 0 : ((currentPage - 1) * LIMIT_ROW) + 1} - {Math.min(currentPage * LIMIT_ROW, totalJobs)} of {totalJobs}
                            </TableCaption>
                            <TableHeader>
                                <TableRow className="border-b border-white/10 bg-slate-800/60 text-slate-300">
                                    <TableHead className="py-2 px-4">ID</TableHead>
                                    <TableHead className="py-2 px-4">Job Name</TableHead>
                                    <TableHead className="py-2 px-4">User</TableHead>
                                    <TableHead className="py-2 px-4">Time</TableHead>
                                    <TableHead className="py-2 px-4">Status</TableHead>
                                    <TableHead className="py-2 px-4">Node Alloc</TableHead>
                                    <TableHead className="py-2 px-4 text-right">CPU Alloc</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {displayedData.length === 0 && (
                                    <TableRow>
                                        <TableCell className="py-8 text-center text-slate-400" colSpan={7}>
                                            No jobs found.
                                        </TableCell>
                                    </TableRow>
                                )}
                                {displayedData.map((item, idx) => (
                                    <TableRow key={item.jobId} className={idx % 2 === 0 ? "bg-white/[0.03]" : "bg-transparent"}>
                                        <TableCell className="py-2 px-4 font-semibold text-slate-100">{item.jobId}</TableCell>
                                        <TableCell className="py-2 px-4 text-slate-300">{item.jobName}</TableCell>
                                        <TableCell className="py-2 px-4 text-slate-300">{item.user}</TableCell>
                                        <TableCell className="py-2 px-4 text-slate-300">{item.time}</TableCell>
                                        <TableCell className="py-2 px-4">
                                            <span className={
                                                item.jobStatus === "RUNNING"
                                                    ? "inline-flex rounded-full bg-emerald-500/20 text-emerald-300 px-2 py-1 text-xs font-semibold"
                                                    : item.jobStatus === "FAILED"
                                                    ? "inline-flex rounded-full bg-rose-500/20 text-rose-300 px-2 py-1 text-xs font-semibold"
                                                    : "inline-flex rounded-full bg-amber-500/20 text-amber-300 px-2 py-1 text-xs font-semibold"
                                            }>
                                                {item.jobStatus.charAt(0).toUpperCase() + item.jobStatus.slice(1).toLowerCase()}
                                            </span>
                                        </TableCell>
                                        <TableCell className="py-2 px-4 text-slate-300">{item.nodeAlloc}</TableCell>
                                        <TableCell className="py-2 px-4 text-right text-slate-200">{item.cpuAlloc}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    <div className="mt-4 flex flex-row items-center justify-between">
                        <span className="text-slate-400 text-sm">Page {currentPage} of {MAX_PAGE}</span>
                        <div className="flex gap-2">
                            <button
                                className="bg-cyan-500 hover:bg-cyan-400 px-4 py-2 rounded-md font-bold text-slate-950 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                onClick={decress}
                                disabled={currentPage === 1}
                            >
                                Prev
                            </button>
                            <button
                                className="bg-cyan-500 hover:bg-cyan-400 px-4 py-2 rounded-md font-bold text-slate-950 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                onClick={incress}
                                disabled={currentPage === MAX_PAGE}
                            >
                                Next
                            </button>
                        </div>
                    </div>

                    </section>
                </div>
            </div>
        );
}