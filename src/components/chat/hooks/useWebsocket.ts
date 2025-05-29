// hooks/useWebSocket.ts
import { useEffect, useRef } from 'react';


const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:8080";

export const useWebSocket = (sessionId: string | null | undefined) => {
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!sessionId) return; // Prevent connecting without sessionId

    const ws = new WebSocket(`${API_BASE_URL.replace(/^http/, 'ws')}`);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('✅ WebSocket connected');
      ws.send(JSON.stringify({ type: 'start', sessionId }));
    };

    ws.onclose = () => {
      console.log('🔌 WebSocket disconnected');
    };

    const pingInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000);

    return () => {
      clearInterval(pingInterval);
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'end', sessionId }));
        ws.close();
      }
    };
  }, [sessionId]);
};
