import { io } from "socket.io-client";

const WS_URL = import.meta.env.VITE_WS_URL || "";

export function createSocket(namespace, token) {
  const url = WS_URL ? `${WS_URL}${namespace}` : namespace;
  return io(url, {
    auth: { token },
    transports: ["websocket", "polling"],
    autoConnect: false,
  });
}
