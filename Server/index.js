const express = require("express");
const mysql = require("mysql");
const cors = require("cors");
const bcryptjs = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { Server } = require("socket.io");
const http = require("http");
const { addUserSocket, removeUserSocket, getUserSocket } = require('./socketManager');


const app = express();

app.use(express.json());
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  }

});

const usernameSocketMap = {};

io.on("connection", (socket) => {
  console.log(socket.id);

  socket.on("authenticate", (username) => {
    try {
      // Store the socket ID associated with the username
      addUserSocket(username, socket.id);
      console.log("socket id", getUserSocket(username));
    } catch (error) {
      console.error('Error authenticating user:', error);
    }
  });

  socket.on("disconnect", () => {
    removeUserSocket(socket.id);
    console.log("User Disconnected", socket.id);
    console.log("this username is gone: ", getUserSocket(socket.id));
  });
});

con.connect((err) => {
  if (err) return console.error(err.message);

  console.log("Connected to the MySQL server now.");
  //var sql = "INSERT INTO users (username,email, password) VALUES ('will', 'wil@gmail.com', 'willpass')";
  /*con.query(sql, function (err, result) {
    if (err) throw err;
    console.log("1 record inserted");
  });
  */
});

// Import the login and signup routes from login.js
const loginRoutes = require("./login")(app, con);
app.use("/", loginRoutes);

// import the verification route form verification.js
const verificationRoutes = require("./verification")(app, con);
app.use("/", verificationRoutes);

const addProjectRoutes = require("./DashboardRoutes/addProject")(app, con);
app.use("/", addProjectRoutes);

const addPdfRoutes = require("./DashboardRoutes/pdf")(app, con);
app.use("/", addPdfRoutes);

const listProjectsRoutes = require("./DashboardRoutes/listProjects")(app, con);
app.use("/", listProjectsRoutes);

const addTaskRoutes = require("./DashboardRoutes/addTask")(app, con);
app.use("/", addTaskRoutes);

const commentsRoutes = require("./DashboardRoutes/comments")(app, con);
app.use("/", commentsRoutes);

const themeRoutes = require("./DashboardRoutes/userTheme")(app, con);
app.use("/", themeRoutes);

const notificationRoutes = require("./DashboardRoutes/notification")(app, con);
app.use("/", notificationRoutes);

const dataRoutes = require("./DashboardRoutes/progressdata")(app, con);
app.use("/", dataRoutes);

const subtaskRoutes = require("./DashboardRoutes/subtasks")(app, con);
app.use("/", subtaskRoutes);

const productBacklogRoutes = require("./DashboardRoutes/productBacklog")(app, con);
app.use("/", productBacklogRoutes);

const collabRoutes = require("./DashboardRoutes/collab")(app, con);
app.use("/", collabRoutes);

const messagesRoutes = require("./DashboardRoutes/messages")(app, con, io);
app.use("/", messagesRoutes);

const firstRoutes = require("./DashboardRoutes/first")(app, con, io);
app.use("/", firstRoutes);

server.listen(3002, () => {
  console.log("SOCKET RUNNING");
});

app.listen(3001, () => {
  console.log("running backend server");
})
