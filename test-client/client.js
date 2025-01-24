// client.js
const { io } = require("socket.io-client");

// Replace this URL with your Socket.IO server address
const socket = io("http://localhost:3000");

// Fires when the client connects successfully
socket.on("connect", () => {
  console.log("Connected to server with ID:", socket.id);

  // Example: Emit a 'chat message' event to the server
  socket.emit("chat message", "Hello from the command-line client!");
});

// Fires when a 'chat message' event is received from the server
socket.on("chat message", (msg) => {
  console.log("Received chat message:", msg);
});

// Fires if the client disconnects
socket.on("disconnect", () => {
  console.log("Disconnected from server");
});
