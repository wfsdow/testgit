var socketio = require('socket.io');
var io;
var guestNumber = 1 ;
var nickNames = {};
var namesUsed = [] ;
var currentRoom = {};

exports.listen = function(server) {
    //启动socket服务器
    io = socketio.listen(server) ;
    io.set('log level', 1);
    //定义用户连接的处理逻辑
    io.sockets.on('connection', function(socket){
        //在用户链接上来时，赋予其一个访客名
        guestNumber = assignGuestName(socket, guestNumber,nickNames, namesUsed);
        //在用户连接上来时，他放入聊天室Lobby
        joinRoom(socket, 'Lobby');
        //处理用户的消息，更名和聊天室的创建和变更
        handleMessageBroadcasting(socket, nickNames);
        handleNameChangeAttempts(socket, nickNames, namesUsed) ;
        handleRoomJoining(socket);
        //用户发出请求时，向其提供已经被占用的聊天室列表
        socket.on('rooms', function(){
            socket.emit('rooms', io.sockets,manager.rooms);
        });
        //用户断开连接后的清除逻辑
        handlerClientDisconnection(socket, nickNames, namesUsed);
    });
};

//分配用户昵称
function assignGuestName(socket, guestNumber, nickNames, namesUsed){
    var name = 'Guest' + guestNumber;
    //将用户昵称和客户端连接id关联
    nickNames[socket.id] = name ;
    //让用户知道自己的昵称
    socket.emit('nameResult', {
        success: true,
        name:name
    });
    //存放被占用的昵称
    namesUsed.push(name);
    //增加用来生产昵称的计数器
    return guestNumber ;
}

//进入聊天室
function joinRoom(socket, room){
    //用户进入房间
    socket.join(room);
    //记录用户当前的房间
    currentRoomp[socket.id] = room ;
    //让用户他们知道进入了新房间
    socket.emit('joinResult',{room:room});
    //让房间里的其他用户知道房间进入了新人
    socket.broadcast.to(room).emit('message',{
        text: nickNames[socket.id] + ' has joined ' +room +'. '
    }) ;

    var usersInRoom = io.sockets.clients(room);
    //判断是否有多个人在聊天室
    if(usersInRoom.length > 1){
        //如果不止一个用户，则将用户消息汇总
        var usersInRoomSummary = 'Users currently in ' + room +': ';
        for (var index in usersInRoom){
            var userSocketId = usersInRoom[index].id;
            if(userSocketId != socket.id){
                if(index >0){
                    usersInRoomSummary += ', ';
                }
                usersInRoomSummary += nickNames[userSocketId];
            }
        }
        usersInRoomSummary += ' .' ;
        //将房间中其他用户的消息汇总发送给此用户
        socket.emit('message', {text: usersInRoomSummary}) ;
    }
}

//更名请求
function handleNameChangeAttempts(sockets, nickNames, namesUsed){
    socket.on('nameAttempt', function(name){
        if(name.indexOf('Guest') ==  0){
            socket.emit('nameResult',{
                success: false,
                message: 'Names cannot begin with "Guest".'
            });
        }else{
            if(namesUsed.indexOf(name) == -1){   //注册还未使用的昵称
                var previousName = nickNames[socket.id];
                var previousNameIndex = namesUsed.indexOf(previousName);
                namesUsed.push(name);
                nickNames[socket.id] = name ;
                //删除之前使用的id
                delete namesUsed[previousNameIndex];
                socket.emit('nameResult',{
                    success:true,
                    name:name
                });
                socket.broadcast.to(currentRoom[socket.id].emit('message',{
                    text: previousName + ' is now known as ' + name + ' .'
                }));
            }else{
                socket.emit('nameResult', {
                    success: false,
                    message: 'This name is already in use.'
                });
            }
        }
    });
}

//发送聊天消息
function handleMessageBroadcasting(socket){
    socket.on('message', function(message){
        socket.broadcast.to(message.room).emit('message',{
            text: nickNames[socket.id] + ': ' + message.text 
        });
    });
}

//创建房间
function handleRoomJoining(socket){
	socket.on('join', function(room){
		socket.leave(currentRoom[socket.id]);
		joinRoom(socket, room.newRoom);
	});
}

//断开连接
function handleClientDisconnection(socket){
	socket.on('disconnect',function(){
		var nameIndex = namesUsed.indexOf(nickNames[socket.id]);
		delete namesUsed[nameIndex];
		delete nickNames[socket.id];
	});
}