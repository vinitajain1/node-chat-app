const express = require("express");
const http = require("http");
const path = require("path");
const socketio = require("socket.io");
const Filter = require('bad-words');
const { generateMessage,generateLocationMessage } = require('./utils/messages');
const {addUser,removeUser,getUser,getUsersInRoom} = require("./utils/user");


const app = express();
const server = http.createServer(app);
const io = socketio().listen(server);

const port = process.env.PORT || 3000;

const publicDirectory = path.join(__dirname,"../public");

app.use(express.static(publicDirectory));

io.on('connection',(socket)=>{
    console.log('New websocket connection');

    socket.on("join",({username,room}, callback)=>{
        const {error,user} = addUser({
                id:socket.id,
                username,
                room
            });

        if(error){
            return callback(error);
        }

        socket.join(user.room);

        socket.emit("message",generateMessage("Admin","Welcome!"));
        socket.broadcast.to(user.room).emit('message',generateMessage("Admin",`${user.username} has joined!`));

        io.to(user.room).emit("roomData",{
            room: user.room,
            users: getUsersInRoom(user.room)
        });

        callback();
    });



    socket.on("chatMessage",(message, callback)=>{
        const filter = new Filter();
        if(filter.isProfane(message)){
            return callback('Profanity is not allowed!');
        }
        const user = getUser(socket.id);
        io.to(user.room).emit("message",generateMessage(user.username,message));
        callback();
    });



    socket.on('disconnect',()=>{
        const user = removeUser(socket.id);

        if(user){
            io.to(user.room).emit("message",generateMessage("Admin",`${user.username} has left!`));

            io.to(user.room).emit("roomData",{
                room: user.room,
                users: getUsersInRoom(user.room)
        });

        }
    });



    socket.on("shareLocation",(position,callback)=>{
        const user = getUser(socket.id);
        io.to(user.room).emit("locationMessage",
        generateLocationMessage(user.username,`https://google.com/maps?q=${position.latitude},${position.longitude}`)
        );
        callback();
    })
});

server.listen(port,()=>{
    console.log("Server is up on port",port);
});
