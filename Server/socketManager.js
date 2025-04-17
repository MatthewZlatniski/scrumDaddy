const userSocketMap = {};

function addUserSocket(username, socketId) {
  userSocketMap[username] = socketId;
}

function removeUserSocket(socketId) {
  for (const [username, socket] of Object.entries(userSocketMap)) {
    if (socket.id === socketId) {
      delete userSocketMap[username];
      break; // Exit the loop once the user is removed
    }
  }
}

function getUserSocket(username) {
  return userSocketMap[username];
}

module.exports = { addUserSocket, removeUserSocket, getUserSocket };