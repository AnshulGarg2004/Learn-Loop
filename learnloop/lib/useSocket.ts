import { useEffect, useRef, useState } from 'react';
import io, { Socket } from 'socket.io-client';

export const useSocket = () => {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);

  useEffect(() => {
    // Connect to Socket.io server
    socketRef.current = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000', {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    socketRef.current.on('connect', () => {
      console.log('Connected to Socket.io server');
      setIsConnected(true);
    });

    socketRef.current.on('disconnect', () => {
      console.log('Disconnected from Socket.io server');
      setIsConnected(false);
    });

    socketRef.current.on('receive-message', (data) => {
      setMessages((prev) => [...prev, data]);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  const joinSession = (sessionId: string, userId: string, userName: string, role: string) => {
    if (socketRef.current) {
      socketRef.current.emit('join-session', {
        sessionId,
        userId,
        userName,
        role,
      });
    }
  };

  const sendMessage = (sessionId: string, message: string) => {
    if (socketRef.current) {
      socketRef.current.emit('send-message', {
        sessionId,
        message,
      });
    }
  };

  const drawOnCanvas = (sessionId: string, drawData: any) => {
    if (socketRef.current) {
      socketRef.current.emit('draw', {
        sessionId,
        drawData,
      });
    }
  };

  const clearCanvas = (sessionId: string) => {
    if (socketRef.current) {
      socketRef.current.emit('clear-canvas', {
        sessionId,
      });
    }
  };

  const moveCursor = (sessionId: string, x: number, y: number) => {
    if (socketRef.current) {
      socketRef.current.emit('cursor-move', {
        sessionId,
        x,
        y,
      });
    }
  };

  const onUserJoined = (callback: (data: any) => void) => {
    if (socketRef.current) {
      socketRef.current.on('user-joined', callback);
    }
  };

  const onUserLeft = (callback: (data: any) => void) => {
    if (socketRef.current) {
      socketRef.current.on('user-left', callback);
    }
  };

  const onDraw = (callback: (data: any) => void) => {
    if (socketRef.current) {
      socketRef.current.on('draw', callback);
    }
  };

  const onClearCanvas = (callback: () => void) => {
    if (socketRef.current) {
      socketRef.current.on('clear-canvas', callback);
    }
  };

  const onCursorMove = (callback: (data: any) => void) => {
    if (socketRef.current) {
      socketRef.current.on('cursor-move', callback);
    }
  };

  return {
    socket: socketRef.current,
    isConnected,
    messages,
    joinSession,
    sendMessage,
    drawOnCanvas,
    clearCanvas,
    moveCursor,
    onUserJoined,
    onUserLeft,
    onDraw,
    onClearCanvas,
    onCursorMove,
  };
};
