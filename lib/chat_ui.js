
//显示可疑信息文本的方法
function divEscapedContentElement(message){
	return $('<div></div>').text(message);
}

//显示可信任文本的方法
function divSystemContentElement(message){
	return $('<div></div>').html('<i>'+ message +'</i>');
}

//处理原始的用户输入
function  processUserInput(chatApp, socket){
	var message = $('#send-message').val();
	var systemMessage ;

	if(message.chatAt(0) == '/'){	//用户输入内容以'/'开头，则作为聊天命令处理
		systemMessage = chatApp.processCommand(message);
		if(systemMessage){
			$('#message').append(divSystemContentElement(systemMessage)) ;
		}
	} else{
		chatApp.sendMessage($('room').text(), message);  //将非命令输入广播给其他用户
		$('#messages').append(divEscapedContentElement(message), message);
		$('#messages').scrollTop($('message').prop('scrollHeight'));
	}

	$('#send-message').val(' ');
}

//客户端程序初始化逻辑
var socket = io.connect();
$(document).ready(function(){
	var chatApp = new Chat(socket);
	//显示尝试更名的结果
	socket.on('nameResult', function(result){
		var message ;
		if(result.success){
			message = 'You are now konwn as' + result.name +' .';
		}else{
			message = result.message ;
		}
		$('#messages').append(divSystemContentElement(message)) ;
	});

	//显示房间变化的结果
	socket.on('joinResult', function(result){
		$('#room').text(result.room);
		$('#messages').append(divSystemContentElement('Room changed.'));
	});

	//显示接受到的信息
	socket.on('message', function(message){
		var newElement = $("<div></div>").text(message.text) ;
		$('#messages').append(newElement) ;

	});

	socket.on('rooms', function(rooms){
		$('#room-list').empty();
		for(var room in rooms){
			room = room.substring(1, room.length);
			if(room != ''){
				$('#room-list').append(divEscapedContentElement(room));
			}
		}

		$('#room-list div').click(function(){
			chatApp.processCommand('/join' +$(this).text);
			$('#send-message').focus();
		});
	});

	setInterval(function(){
		socket.emit('rooms');
	}, 1000);

	$('#send-message').focus();

	$('#send-form').submit(function(){
		processUserInput(chatApp,socket);
		return false ;
	});
});