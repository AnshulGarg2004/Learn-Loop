"use client";

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import io, { Socket } from 'socket.io-client';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  messages: any[];
  setInitialMessages: (initialMessages: any[]) => void;
  joinSession: (sessionId: string, userId: string, userName: string, role: string) => void;
  sendMessage: (sessionId: string, message: string) => void;
  drawOnCanvas: (sessionId: string, drawData: any) => void;
  clearCanvas: (sessionId: string) => void;
  moveCursor: (sessionId: string, x: number, y: number) => void;
  endSession: (sessionId: string) => void;
  registerUser: (userId: string) => void;
  tutorAccepted: (studentId: string, sessionId: string, tutorName: string) => void;
  onUserJoined: (callback: (data: any) => void) => (() => void) | void;
  onUserLeft: (callback: (data: any) => void) => (() => void) | void;
  onDraw: (callback: (data: any) => void) => (() => void) | void;
  onClearCanvas: (callback: () => void) => (() => void) | void;
  onCursorMove: (callback: (data: any) => void) => (() => void) | void;
  onSessionEnded: (callback: () => void) => (() => void) | void;
  onRequestAccepted: (callback: (data: { sessionId: string; tutorName: string }) => void) => (() => void) | void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);

  useEffect(() => {
    socketRef.current = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000', {
      reconnection: true,
      reconnectionDelay: 1000,
    });

    socketRef.current.on('connect', () => {
      console.log('[SOCKET] Connected:', socketRef.current?.id);
      setIsConnected(true);
    });

    socketRef.current.on('disconnect', () => {
      console.log('[SOCKET] Disconnected');
      setIsConnected(false);
    });

    socketRef.current.on('receive-message', (data) => {
      setMessages((prev) => [...prev, data]);
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  const setInitialMessages = (initialMessages: any[]) => {
    setMessages(initialMessages);
  };

  const joinSession = (sessionId: string, userId: string, userName: string, role: string) => {
    socketRef.current?.emit('join-session', { sessionId, userId, userName, role });
  };

  const sendMessage = (sessionId: string, message: string) => {
    socketRef.current?.emit('send-message', { sessionId, message });
  };

  const drawOnCanvas = (sessionId: string, drawData: any) => {
    socketRef.current?.emit('draw', { sessionId, drawData });
  };

  const clearCanvas = (sessionId: string) => {
    socketRef.current?.emit('clear-canvas', { sessionId });
  };

  const moveCursor = (sessionId: string, x: number, y: number) => {
    socketRef.current?.emit('cursor-move', { sessionId, x, y });
  };

  const endSession = (sessionId: string) => {
    socketRef.current?.emit('end-session', { sessionId });
  };

  const registerUser = (userId: string) => {
    socketRef.current?.emit('register-user', userId);
  };

  const tutorAccepted = (studentId: string, sessionId: string, tutorName: string) => {
    socketRef.current?.emit('tutor-accepted', { studentId, sessionId, tutorName });
  };

  const onUserJoined = (callback: (data: any) => void) => {
    socketRef.current?.on('user-joined', callback);
    return () => socketRef.current?.off('user-joined', callback);
  };

  const onUserLeft = (callback: (data: any) => void) => {
    socketRef.current?.on('user-left', callback);
    return () => socketRef.current?.off('user-left', callback);
  };

  const onDraw = (callback: (data: any) => void) => {
    socketRef.current?.on('draw', callback);
    return () => socketRef.current?.off('draw', callback);
  };

  const onClearCanvas = (callback: () => void) => {
    socketRef.current?.on('clear-canvas', callback);
    return () => socketRef.current?.off('clear-canvas', callback);
  };

  const onCursorMove = (callback: (data: any) => void) => {
    socketRef.current?.on('cursor-move', callback);
    return () => socketRef.current?.off('cursor-move', callback);
  };

  const onSessionEnded = (callback: () => void) => {
    socketRef.current?.on('session-ended', callback);
    return () => socketRef.current?.off('session-ended', callback);
  };

  const onRequestAccepted = (callback: (data: { sessionId: string; tutorName: string }) => void) => {
    socketRef.current?.on('request-accepted', callback);
    return () => socketRef.current?.off('request-accepted', callback);
  };

  return (
    <SocketContext.Provider value={{
      socket: socketRef.current,
      isConnected,
      messages,
      setInitialMessages,
      joinSession,
      sendMessage,
      drawOnCanvas,
      clearCanvas,
      moveCursor,
      endSession,
      registerUser,
      tutorAccepted,
      onUserJoined,
      onUserLeft,
      onDraw,
      onClearCanvas,
      onCursorMove,
      onSessionEnded,
      onRequestAccepted
    }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
