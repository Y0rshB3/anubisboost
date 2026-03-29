import { io } from "socket.io-client";

export function createSocket(namespace, token) {
  return io(namespace, {
    auth: { token },
    transports: ["websocket", "polling"],
    autoConnect: false,
  });
}
