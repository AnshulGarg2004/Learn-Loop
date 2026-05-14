"use client";

import { useEffect, useState, useRef } from "react";
import dynamic from "next/dynamic";
import "@excalidraw/excalidraw/index.css";
import { useSocket } from "@/lib/useSocket";

const Excalidraw = dynamic(
    async () => (await import("@excalidraw/excalidraw")).Excalidraw,
    {
        ssr: false,
    }
);

interface WhiteboardProps {
    sessionId?: string;
    role?: string;
}

export default function Whiteboard({ sessionId, role }: WhiteboardProps) {
    const { isConnected, drawOnCanvas, onDraw } = useSocket();
    const [excalidrawAPI, setExcalidrawAPI] = useState<any>(null);
    const isReceivingRef = useRef(false);
    const isTutor = role === 'tutor';

    // Sync from socket to local
    useEffect(() => {
        if (!excalidrawAPI || !sessionId) return;

        const handleRemoteDraw = (drawData: any) => {
            if (isReceivingRef.current) return;
            
            console.log("[WHITEBOARD] Received remote draw", drawData.elements?.length, "elements");
            isReceivingRef.current = true;
            
            // Only update elements to avoid appState sync issues (like collaborators crash)
            excalidrawAPI.updateScene({
                elements: drawData.elements,
                commitToHistory: false
            });
            
            setTimeout(() => { 
                isReceivingRef.current = false; 
            }, 50);
        };

        const cleanup = onDraw(handleRemoteDraw);
        return () => { if (cleanup) cleanup(); };
    }, [excalidrawAPI, sessionId, onDraw, isTutor]);

    const lastBroadcastRef = useRef(0);
    const handleChange = (elements: any) => {
        if (!isTutor || isReceivingRef.current || !isConnected || !sessionId) return;

        const now = Date.now();
        if (now - lastBroadcastRef.current < 150) return; // Throttle slightly more
        lastBroadcastRef.current = now;

        console.log("[WHITEBOARD] Broadcasting draw", elements?.length, "elements");
        drawOnCanvas(sessionId, {
            elements,
            sessionId
        });
    };

    return (
        <div className="h-[600px] w-full border-2 border-slate-100 rounded-3xl overflow-hidden shadow-2xl bg-white relative">
            {!isConnected && (
                <div className="absolute inset-0 z-10 bg-white/80 backdrop-blur-sm flex items-center justify-center">
                    <p className="text-xs font-black uppercase tracking-widest text-slate-400 animate-pulse">Connecting Whiteboard...</p>
                </div>
            )}
            <Excalidraw
                excalidrawAPI={(api) => setExcalidrawAPI(api)}
                onChange={handleChange}
                theme="light"
                viewModeEnabled={!isTutor}
                gridModeEnabled={true}
            />
        </div>
    );
}