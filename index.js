// server.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const admin = require('firebase-admin');
const serviceAccount = process.env.KEY_JSON || require('./key.json');
console.log(serviceAccount)

const app = express();
const server = http.createServer(app);
const io = new Server(server);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://mrhonbook-default-rtdb.firebaseio.com', 
});

const db = admin.database(); // get a reference to the Realtime Database

// Serve a simple route to confirm server is running
app.get('/', (req, res) => {
  res.send('Socket.IO server is up and running!');
});

// Listen for client connections on Socket.IO
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // You can listen for custom events
  socket.on('chat message', async (msg) => {
    console.log('Received chat message:', msg);
    try {
      await db.ref('messages').push({
        text: msg,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error('Failed to save message:', error);
    }
  });

  // If the user disconnects
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

db.ref('messages').on('child_added', (snapshot) => {
    const newMessage = snapshot.val();
    // Broadcast 'new message' event to all clients
    io.emit('new message', newMessage);
  });

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
