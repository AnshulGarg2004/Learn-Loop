"use client";

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useSocket } from '@/lib/useSocket';
import { useUser } from '@clerk/nextjs';

export default function GlobalNotification() {
  const router = useRouter();
  const { user } = useUser();
  const { isConnected, registerUser, onRequestAccepted } = useSocket();
  const [incomingSession, setIncomingSession] = useState<{ sessionId: string; tutorName: string } | null>(null);

  // Register for notifications on EVERY page
  useEffect(() => {
    if (isConnected && user?.id) {
      console.log("[NOTIF] Registering user:", user.id);
      registerUser(user.id);
    }
  }, [isConnected, user?.id, registerUser]);

  useEffect(() => {
    const cleanup = onRequestAccepted((data) => {
      console.log("[NOTIF] Incoming session received:", data);
      setIncomingSession(data);
    });
    return () => { if (cleanup) cleanup(); };
  }, [onRequestAccepted]);

  return (
    <AnimatePresence>
      {incomingSession && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.9 }}
          className="fixed bottom-8 right-8 z-[100] max-w-sm w-full"
        >
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-indigo-100 p-5 ring-1 ring-black/5">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white text-2xl shadow-lg shadow-indigo-200 shrink-0">
                🚀
              </div>
              <div className="flex-1">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-1">Tutor Ready!</h3>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  <span className="font-bold text-indigo-600">{incomingSession.tutorName}</span> has accepted your session.
                </p>
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => {
                      const sid = String(incomingSession.sessionId);
                      console.log("[NOTIF] Redirecting to session:", sid);
                      if (sid) {
                        setIncomingSession(null);
                        window.location.href = `/session/${sid}`;
                      }
                    }}
                    className="flex-1 bg-indigo-600 text-white py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100 text-center"
                  >
                    Join Now
                  </button>
                  <button
                    onClick={() => setIncomingSession(null)}
                    className="px-4 py-2 bg-slate-50 text-slate-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
