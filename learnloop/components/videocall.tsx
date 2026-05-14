'use client'
import React, { useEffect, useRef, useState } from 'react'

const VideoRoom = ({ roomId }: { roomId: string }) => {
    const zpRef = useRef<any>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const start = async () => {
            try {
                setLoading(true);
                const { ZegoUIKitPrebuilt } = await import("@zegocloud/zego-uikit-prebuilt");

                const appId = process.env.NEXT_PUBLIC_ZEEGO_APP_ID;
                const serverSecret = process.env.NEXT_PUBLIC_ZEEGO_SERVER_SECRET;
                
                if (!appId || !serverSecret) {
                    throw new Error("ZegoCloud credentials missing. Please set NEXT_PUBLIC_ZEEGO_APP_ID and NEXT_PUBLIC_ZEEGO_SERVER_SECRET in .env");
                }

                const userId = crypto.randomUUID();
                const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
                    Number(appId), 
                    serverSecret, 
                    roomId, 
                    userId, 
                    "User_" + Math.floor(Math.random() * 1000)
                );
                
                const zp = ZegoUIKitPrebuilt.create(kitToken);
                zpRef.current = zp;

                zp.joinRoom({
                    container: containerRef.current,
                    scenario: {
                        mode: ZegoUIKitPrebuilt.VideoConference,
                    },
                    showPreJoinView: false,
                    showTextChat: true,
                    showUserList: true,
                    onJoinRoom: () => setLoading(false),
                });
            } catch (err: any) {
                console.error("Video room error:", err);
                setError(err.message || "Failed to join video room");
                setLoading(false);
            }
        }
        
        start();

        return () => {
            if (zpRef.current) {
                try {
                    zpRef.current.destroy();
                } catch (e) {
                    console.error("Error destroying video room:", e);
                }
            }
        }
    }, [roomId])

    if (error) {
        return (
            <div className="w-full h-full bg-slate-900 flex flex-col items-center justify-center p-8 text-center rounded-[2rem]">
                <div className="w-16 h-16 rounded-full bg-rose-500/20 text-rose-500 flex items-center justify-center text-3xl mb-4">⚠️</div>
                <h3 className="text-white font-black uppercase tracking-widest text-sm mb-2">Video Call Error</h3>
                <p className="text-slate-400 text-[10px] max-w-xs leading-relaxed">{error}</p>
            </div>
        );
    }

    return (
        <div className="relative w-full h-full bg-slate-900 rounded-[2rem] overflow-hidden shadow-2xl border-4 border-white/5">
            {loading && (
                <div className="absolute inset-0 z-20 bg-slate-900 flex flex-col items-center justify-center">
                    <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mb-4" />
                    <p className="text-indigo-400 text-[10px] font-black uppercase tracking-[0.2em]">Connecting to Classroom...</p>
                </div>
            )}
            <div ref={containerRef} className="w-full h-full" />
        </div>
    )
}

export default VideoRoom
