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
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="fixed bottom-6 right-6 z-[100] max-w-sm w-full"
        >
          <div className="bg-white rounded-lg shadow-sm border border-zinc-200 p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-md bg-zinc-900 flex items-center justify-center text-white text-lg shrink-0">
                🚀
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-zinc-900 tracking-tight">Tutor Ready</h3>
                <p className="text-sm text-zinc-500 mt-0.5">
                  <span className="font-medium text-zinc-900">{incomingSession.tutorName}</span> has accepted your session.
                </p>
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => {
                      const sid = String(incomingSession.sessionId);
                      if (sid) {
                        setIncomingSession(null);
                        window.location.href = `/session/${sid}`;
                      }
                    }}
                    className="flex-1 bg-zinc-900 text-white py-1.5 rounded-md text-sm font-medium hover:bg-zinc-800 transition-colors"
                  >
                    Join Session
                  </button>
                  <button
                    onClick={() => setIncomingSession(null)}
                    className="px-3 py-1.5 bg-white border border-zinc-200 text-zinc-600 rounded-md text-sm font-medium hover:bg-zinc-50 transition-colors"
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
