import { Server } from "socket.io";

const io = new Server(3000, {
  cors: true,
  pingTimeout: 1000,
});

const roomsData = {};

io.on("connection", (socket) => {
  socket.on("user:join", ({ roomName, email }) => {
    socket.email = email;
    if (!roomsData[roomName]) {
      socket.emit("room:new", {});
      roomsData[roomName] = {
        users: [
          {
            email,
            socketId: socket.id,
          },
        ],
      };
      socket.join(roomName);
      socket.roomName = roomName;
    } else {
      const room = roomsData[roomName];
      socket.emit("room:old", { users: room.users });
      room.users.push({
        email,
        socketId: socket.id,
      });
      socket.join(roomName);
      socket.roomName = roomName;
    }
  });

  socket.on("offer", ({ to, offer }) => {
    const user = {
      email: socket.email,
      socketId: socket.id,
    };
    io.to(to).emit("offer", { user, offer });
  });

  socket.on("answer", ({ to, answer }) => {
    const user = {
      email: socket.email,
      socketId: socket.id,
    };
    io.to(to).emit("answer", { user, answer });
  });

  socket.on("candidate", ({ to, candidate }) => {
    const user = {
      email: socket.email,
      socketId: socket.id,
    };
    io.to(to).emit("candidate", { user, candidate });
  });

  socket.on("disconnect", () => {
    const roomName = socket.roomName;
    let leavingUserIndex = roomsData[roomName].users.findIndex(
      (user) => user.socketId === socket.id
    );
    roomsData[roomName].users.splice(leavingUserIndex, 1);
    if (roomsData[roomName].users.length === 0) delete roomsData[roomName];
    io.to(roomName).emit("user:leave", { socketId: socket.id });
  });

  socket.on("room:leave", () => {
    const roomName = socket.roomName;
    let leavingUserIndex = roomsData[roomName].users.findIndex(
      (user) => user.socketId === socket.id
    );
    roomsData[roomName].users.splice(leavingUserIndex, 1);
    if (roomsData[roomName].users.length === 0) delete roomsData[roomName];
    io.to(roomName).emit("user:leave", { socketId: socket.id });
  });
});

console.log("SERVER STARTED!");
