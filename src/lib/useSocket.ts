import { useEffect, useState, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { useAppSelector } from "@/redux/store/hooks";

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
  onNotification?: (data: any) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
}

export function useSocket(
  outletId?: string | null,
  options: UseSocketOptions = {}
) {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const user = useAppSelector((state) => state.auth.user);

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
      query: {
        userId: user?.id || "",
        role: user?.role || "",
        businessId: user?.businessId || "",
        outletId: outletId && outletId !== "all" ? outletId : "",
      },
      auth: {
        userId: user?.id || "",
        role: user?.role || "",
        businessId: user?.businessId || "",
        outletId: outletId && outletId !== "all" ? outletId : "",
      },
    });

    socketRef.current = socket;

    const handleConnect = () => {
      setIsConnected(true);
      if (user?.id) socket.emit("join_user", user.id);
      if (user?.role) socket.emit("join_role", { role: user.role, businessId: user?.businessId, outletId });
      if (outletId && outletId !== "all") socket.emit("join_outlet", outletId);
      if (user?.businessId) socket.emit("join_business", user.businessId);
      optionsRef.current.onConnect?.();
    };

    const handleDisconnect = () => {
      setIsConnected(false);
      optionsRef.current.onDisconnect?.();
    };

    let lastExecuted = 0;
    let throttleTimeout: any = null;

    const handleKDSUpdate = (data: any) => {
      const now = Date.now();
      const throttleLimit = 2000; // 2 seconds throttle window

      const executeUpdate = () => {
        lastExecuted = Date.now();
        optionsRef.current.onKDSUpdate?.(data);
      };

      if (throttleTimeout) {
        clearTimeout(throttleTimeout);
      }

      if (now - lastExecuted >= throttleLimit) {
        executeUpdate();
      } else {
        const delay = throttleLimit - (now - lastExecuted);
        throttleTimeout = setTimeout(executeUpdate, delay);
      }
    };

    const handleNotification = (data: any) => {
      optionsRef.current.onNotification?.(data);
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("kds_update", handleKDSUpdate);
    socket.on("notification", handleNotification);

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
      socket.off("notification", handleNotification);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [outletId, user?.id, user?.role, user?.businessId]);

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

