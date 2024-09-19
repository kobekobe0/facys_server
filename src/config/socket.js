import http from "http";
import {Server} from "socket.io";

const createSocketServer = (app, port) => {
  const server = http.createServer(app);

  const io = new Server(server, {
    cors: {
      origin: ["http://157.245.193.50:3000", "http://localhost:3000", "http://dashboard.truesightphotography.com", "http://stg-dashboard.truesightphotography.com"],
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log("A user connected");

    socket.on("disconnect", () => {
        console.log("A user disconnected");
    });
  });

  server.listen(process.env.SOCKET_PORT, () => {
    console.log(`Socket.IO server running on http://localhost:${process.env.SOCKET_PORT}`);
  });

  return io;
};

export default createSocketServer;
