import { useState } from "react";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "./ui/chart";
interface NodeCardProp {
    cardTitle: string,
    cardDetail: string,
    cardState: "up" | "busy" | "dead",
    total_mem: number,
    chartData: NodeCardData
}
interface NodeCardData {
    start_time: string;
    end_time: string;
    data_amount: number;
    data: Array<{
        timestamp: string;
        cpu: number;
        mem: number;
    }>;
}

const STATE_COLORS: Record<"up" | "busy" | "dead", string> = {
    up: "bg-green-500",
    busy: "bg-yellow-500",
    dead: "bg-red-500"
};

const CHART_CONFIG = {
    desktop: {
        label: "Desktop",
        color: "var(--chart-1)"
    }
} satisfies ChartConfig;


const getButtonClassName = (isActive: boolean, isDisabled: boolean) =>
    `px-2 py-1 mb-1 rounded-sm font-sm transition-all ${isActive
        ? "bg-indigo-500 text-white"
        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
    } ${isDisabled ? "cursor-not-allowed opacity-50" : ""}`;


export function NodeCard(props: NodeCardProp) {
    const [selectedMetric, setSelectedMetric] = useState<"cpu" | "mem">("cpu");
    const isDisabled = props.cardState === "dead";
    const yAxisDomain: [number, number] = [0, selectedMetric === "cpu" ? 100 : props.total_mem];

    
    const lastCpu = props.chartData.data.length > 0 ? props.chartData.data[props.chartData.data.length - 1].cpu : null;
    const lastMem = props.chartData.data.length > 0 ? props.chartData.data[props.chartData.data.length - 1].mem : null;

    return (
        <Card className={`m-4 relative transition-transform ${!isDisabled ? "hover:scale-105 cursor-pointer" : ""}`}>
            <CardHeader>
                <CardTitle className="text-xl">{props.cardTitle}</CardTitle>
                <CardDescription>
                    <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${STATE_COLORS[props.cardState]}`} />
                        <p className="text-lg">{props.cardState}</p>
                    </div>
                </CardDescription>
                <CardAction>
                    <div className="flex items-center gap-2">
                        <img src="/cpu.png" alt="CPU" className="w-6 h-6" />
                        <p className="font-bold text-gray-800">
                            {lastCpu !== null ? `${lastCpu.toFixed(2)}%` : "N/A"}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <img src="/memory.png" alt="RAM" className="w-6 h-6" />
                        <p className="font-bold text-gray-800">
                            {lastMem !== null ? `${lastMem}/${props.total_mem}GB` : "N/A"}
                        </p>
                    </div>
                </CardAction>
            </CardHeader>
            <CardContent>
                <div className={`flex flex-col justify-center items-end-safe mb-4 ${isDisabled ? "pointer-events-none opacity-50" : ""}`}>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setSelectedMetric("cpu")}
                            disabled={isDisabled}
                            className={getButtonClassName(selectedMetric === "cpu", isDisabled)}
                        >
                            CPU
                        </button>
                        <button
                            onClick={() => setSelectedMetric("mem")}
                            disabled={isDisabled}
                            className={getButtonClassName(selectedMetric === "mem", isDisabled)}
                        >
                            RAM
                        </button>
                    </div>
               </div>

                <ChartContainer config={CHART_CONFIG}>
                    <LineChart
                        accessibilityLayer
                        data={props.chartData.data}
                        margin={{
                            left: -20,
                            right: 0
                        }}
                    >
                        <CartesianGrid vertical={false} />
                        <XAxis
                            dataKey="timestamp"
                            tick={false}
                            tickLine={false}
                            axisLine={false}
                            tickMargin={10}
                        />
                        <YAxis
                            domain={yAxisDomain}
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                        />
                        <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent hideLabel />}
                        />
                        <Line
                            dataKey={selectedMetric}
                            type="natural"
                            stroke="var(--color-desktop)"
                            strokeWidth={2}
                            isAnimationActive={false}
                            dot={false}
                        />
                    </LineChart>
                </ChartContainer>
            </CardContent>
            {isDisabled && (
                <div className="absolute inset-0 bg-red-300/25 rounded-lg" />
            )}
        </Card>
    );
}