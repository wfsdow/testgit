var Chat = function (socket){
    this.socket = socket ;
};

//添加发送聊天消息的函数
Chat.prototype.sendMessage = function(room, next){
    var message = {
        room: room ,
        text:text
    };
    this.socket.emit('message', message);
}

//变更房间的函数
Chat.prototype.changRoom = function(room){
    this.socket.emit('join',{
        newRoom:room
    });
}

//处理聊天命令
Chat.prototype.processCommand = function(command){
	var words = command.split(" ");
	//从第一个单词开始解析命令
	var command = words[0].substring(1, words[0].length).toLowerCase();
	var message = false ;
	switch(command){
		case 'join':    		//处理房间的切换
			words.shift();
			var room = words.join(' ');
			this.changRoom(room) ;
			break ;
		case 'nick':      //处理更名的请求
			words.shift();
			var name = words.join(' ') ;
			this.socket.emit('nameAttempt', name);
			break ; 
		default:      //无法识别的消息，返回错误消息
			message = 'Unrecognized command';
			break ;
	}

	return message ;
}