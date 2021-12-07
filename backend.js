const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http, {maxHttpBufferSize: 10e7});
const port = process.env.PORT || 3000;
var mongoDb = require('mongodb');
const dbUrl = "mongodb+srv://ChatAppUser1:ChatAppWs21@cluster0.wxyii.mongodb.net/test";
let onlineUsersMap = new Map();
var currentTime = new Date();

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/pages/index.html');
});
app.get('/index.js', (req, res) => {
    res.sendFile(__dirname + '/src/index.js');
});
app.get('/auth.js', (req, res) => {
    res.sendFile(__dirname + '/src/auth.js');
});
app.get('/chat.js', (req, res) => {
    res.sendFile(__dirname + '/src/chat.js');
});
app.get('/styles.css', (req, res) => {
    res.sendFile(__dirname + '/pages/styles.css');
});


io.on('connection', (socket) => {

    socket.on("login", log => {
        login(log);
    });

    //function for logging in
    async function login(log) {
        // database connection
        var dbClient = require('mongodb').MongoClient;
        await dbClient.connect(dbUrl, function (err, db) {
            if (err) {
                throw err;
            }

            //def. of database
            var dbo = db.db("Cluster0");
            //search name in database compare if already available
            dbo.collection("User").findOne({name: log.userName}, function (err, result) {
                if (err) {
                    throw err;
                }

                //if there is no entry in DB, the user will added.
                let returnValue;
                if (result == null) {
                    dbo.collection("User").insertOne({
                        name: log.userName,
                        password: log.password
                    });
                    returnValue = {loginSuccessful: true};

                    //If the user and password entered are correct, the login will continue.
                } else if (log.userName == result.name && log.password == result.password) {
                    returnValue = {loginSuccessful: true};

                    //if user does exist but password is wrong writing false to returnValue
                } else {
                    returnValue = {loginSuccessful: false};
                }

                returnValue.userName = log.userName;
                returnValue.mySocketId = socket.id;

                io.to(socket.id).emit('loginResult', returnValue);
                //closing DB connection
                db.close();
            });
        });
    }

    socket.on('chat message', msg => {
        let recipients = msg.recip;
        let recipID;
        var selectedUser = 0;
        var chatRoom = null;

        if (recipients.length == 1) {
            recipID = recipients[0];
            selectedUser = 1;
        } else {
            selectedUser = recipients.length;

        }
        var message = "";
        if (selectedUser == 0 || chatRoom) {
            message = currentTime.toLocaleDateString() + "-"
                + currentTime.toLocaleTimeString() + " - " + " " + onlineUsersMap.get(socket.id) + ": " + msg.msg;
        } else {
            var message = currentTime.toLocaleDateString() + "-"
                + currentTime.toLocaleTimeString() + " - " + "(PRIVAT from) " + onlineUsersMap.get(socket.id) + ": " + "- " + msg.msg;
        }

        //sends to all users
        if (selectedUser == 0) {
            io.emit('chat message', message);
        }

        //sends a private message
        else if (selectedUser == 1) {
            io.to(socket.id).emit('chat message', message);
            socket.to(recipID).emit('chat message', message);
        }

        //sends a message to more than one User
        else if (selectedUser > 1) {
            io.to(socket.id).emit('chat message', message);
            for (recipient of recipients) {
                socket.to(recipient).emit('chat message', message);
            }
        }
    });


    //If join a new user a message to all will written and refresh the list of users
    socket.on('join', name => {
        onlineUsersMap.set(socket.id, name);
        messageToAllClients(name + " has joined the chat");
        refreshOnlineUsersInClients();
    });

    //When the connection of a chat participant is terminated, all users receive a message and the user list is updated.
    socket.on('disconnect', () => {
        if (onlineUsersMap.has(socket.id)) {
            messageToAllClients(onlineUsersMap.get(socket.id) + " has left the chat");
            onlineUsersMap.delete(socket.id);
            refreshOnlineUsersInClients();
        }
    });

    //function for message to all Clients
    function messageToAllClients(message) {
        io.emit('messageToAll', message);
    }

    //function for refresh the online users
    function refreshOnlineUsersInClients() {
        io.emit('refreshOnlineUsers', Array.from(onlineUsersMap));
    }

    //creates and sends a multimedia message
    socket.on('media', file => {
        var sendCount = 0;
        let recipients = file.recip;
        let recipId;
        var chatRoom = null;

        for (recipId of recipients) {
            io.sockets.sockets.get(recipId).join("multiCast");
            sendCount++;
        }

        //sends the uploaded file to all users
        if (sendCount == 0) {
            io.emit('media', {type: file.type, msg: file.msg, data: file.data});
        }

        //sends file via private message
        else if (sendCount == 1) {
            io.to(socket.id).emit('media', {type: file.type, msg: "( Mediadata from) " + file.msg, data: file.data});
            socket.to(recipient).emit('media', {type: file.type, msg: "( Mediadata from) " + file.msg, data: file.data});
        }

        //sends a message to multiple participants
        else if (sendCount > 1) {
            io.to(socket.id).emit('media', {type: file.type, msg: "( Mediadata from) " + file.msg, data: file.data});
            for (recipient of recipients) {
                socket.to(recipient).emit('media', {type: file.type, msg: "( Mediadata from) " + file.msg, data: file.data});
            }
        }

        for (recipId of recipients) {
            io.sockets.sockets.get(recipId).leave("multiCast");
        }
    });

});

http.listen(port, () => {
    console.log(`Socket.IO server running at http://localhost:${port}/`);

});
