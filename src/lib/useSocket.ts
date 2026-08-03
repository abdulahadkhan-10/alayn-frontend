import { useEffect, useState, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";

export function getSocketUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_SOCKET_URL || process.env.NEXT_PUBLIC_API_URL;
  if (envUrl) {
    return envUrl.replace(/\/api\/v\d+\/?$/, "").replace(/\/$/, "");
  }
  if (typeof window !== "undefined") {
    const origin = window.location.origin;
    return origin.replace(/:\d+$/, ":5000");
  }
  return "http://localhost:5000";
}

interface UseSocketOptions {
  onKDSUpdate?: (data: any) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
}

export function useSocket(
  outletId?: string | null,
  options: UseSocketOptions = {}
) {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  // Store options in refs so callbacks don't cause unnecessary reconnects
  const optionsRef = useRef(options);
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  useEffect(() => {
    const socketUrl = getSocketUrl();
    const socket: Socket = io(socketUrl, {
      transports: ["websocket", "polling"],
      withCredentials: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    const handleConnect = () => {
      setIsConnected(true);
      if (outletId && outletId !== "all") {
        socket.emit("join_outlet", outletId);
      }
      optionsRef.current.onConnect?.();
    };

    const handleDisconnect = () => {
      setIsConnected(false);
      optionsRef.current.onDisconnect?.();
    };

    const debounceTimerRef = { current: null as any };

    const handleKDSUpdate = (data: any) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(() => {
        optionsRef.current.onKDSUpdate?.(data);
      }, 250);
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("kds_update", handleKDSUpdate);

    // If socket is already connected immediately
    if (socket.connected) {
      handleConnect();
    }

    return () => {
      if (outletId && outletId !== "all" && socket.connected) {
        socket.emit("leave_outlet", outletId);
      }
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("kds_update", handleKDSUpdate);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [outletId]);

  const emit = useCallback((event: string, data?: any) => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit(event, data);
    }
  }, []);

  return {
    socket: socketRef.current,
    isConnected,
    emit,
  };
}
