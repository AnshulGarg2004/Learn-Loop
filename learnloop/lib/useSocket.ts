"use client";

import { useSocket as useSocketContext } from '@/context/SocketContext';

export const useSocket = () => {
  return useSocketContext();
};
