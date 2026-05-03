import type { LoadingPagesProps } from "../model/Loading";
import { useState, useEffect } from "react";

export function Loading(props: LoadingPagesProps) {

    const [avtiveNode, setActiveNode] = useState<number[]>([]);

    useEffect(() => {
        const interval = setInterval(() => {
            const count = Math.floor(Math.random() * 5) + 1;
            const newActiveNode = Array.from({ length: count }, () => Math.floor(Math.random() * 16));
            setActiveNode(newActiveNode);
        }, 500);
        return () => clearInterval(interval);
    }, []);

    const message = props.message || "Loading...";

    const sizeClass = {
        small: "h-8 w-8",
        medium: "h-16 w-16",
        large: "flex-grow h-32 w-32",
        full: "h-screen w-screen"
    }[props.size || "medium"] || "h-16 w-16";

    // temp zone
    const col = 4
    const row = 4
    const space = 10

    const reactangleSize = 50;
    const totalWidth = col * reactangleSize + (col - 1) * space;
    const totalHeight = row * reactangleSize + (row - 1) * space;
    // end of temp zone

    return (
    <div className={`flex flex-col items-center justify-center ${sizeClass} bg-slate-950`}>
        <svg 
      width={totalWidth} 
      height={totalHeight} 
      viewBox={`0 0 ${totalWidth} ${totalHeight}`} 
      xmlns="http://www.w3.org/2000/svg"
    >
        {Array.from({ length: row }).map((_, rowIndex) => (
            Array.from({ length: col }).map((_, colIndex) => (
                <rect 
                    key={`${rowIndex}-${colIndex}`}
                    x={colIndex * (reactangleSize + space)}
                    y={rowIndex * (reactangleSize + space)}
                    width={reactangleSize}
                    height={reactangleSize}
                    fill={avtiveNode.includes(rowIndex * col + colIndex) ? "#22d3ee" : "#1e293b"}
                    className="animate-pulse"
                />
            ))
        ))}
    </svg>

        <p className="mt-4 text-lg text-slate-300">{message}</p>

    </div>)
}