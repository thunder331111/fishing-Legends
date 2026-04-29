let io;

module.exports = (req, res) => {
  if (!io) {
    const { Server } = require('socket.io');
    const { createServer } = require('http');
    io = new Server(res.socket.server);
    
    io.on('connection', (socket) => {
      console.log('✅ Player joined:', socket.id);
      
      // Simple rooms (max 30)
      const room = Object.keys(io.sockets.adapter.rooms).find(r => 
        io.sockets.adapter.rooms.get(r)?.size < 30
      ) || `room_${Date.now()}`;
      
      socket.join(room);
      
      // Send player list
      const players = Array.from(io.sockets.adapter.rooms.get(room) || []).map(id => ({
        id,
        username: socket.handshake.query.username || 'Player'
      }));
      
      socket.to(room).emit('playerList', players);
      socket.emit('playerList', players);
      socket.emit('serverId', room);
      
      socket.on('chat', (msg) => {
        socket.to(room).emit('chat', {
          username: socket.handshake.query.username || 'Player',
          message: msg
        });
      });
      
      socket.on('disconnect', () => {
        console.log('❌ Player left:', socket.id);
      });
    });
    
    res.socket.server.io = io;
  }
  
  res.end();
};
