var http = require('http');
var fs = require('fs') ;
var path = require('path');
var mime = require('mime');
var cache = {};		//用来缓存文件中的内容

//找不到对应文件时调用此函数
function send404(response){
	response.writeHead(404, {'Content-Type':'text/plain'});
	response.write('Error 404: resourse not found');
	response.end();
}

//将html文件发送到浏览器
function sendFile(response, filePath, fileContents){
	response.writeHead(200, 
		{"Content-Type": mime.lookup(path.basename(filePath))});
	response.end(fileContents);
}

//提供静态文件服务的方法
function serveStatic(response, cache, absPath){
	//检查文件是否缓存在内存中
	if(cache[absPath]){
		sendFile(response, absPath, cache[absPath]);	//从内存中返回文件
	}else{
		fs.exists(absPath, function(exists){		//判断文件是否存在
			if(exists){
				fs.readFile(absPath, function(err, data){		//读取文件进入内存中
					if(err){
						send404(response);
					}else{
						cache[absPath] = data ;
						sendFile(response, absPath, data) ;
					}
				});
			}else{
				send404(response);
			}
		});
	}
}

//创建服务端，在回调函数中处理http请求
var server = http.createServer(function(request, response){
	var filePath = false ;
	if(request.url === '/'){
		filePath = 'public/index.html';		//返回默认的html文件
	}else{
		filePath = 'public' + request.url ;		//将url路径转为文件的相对路径
	}

	var absPath = './' + filePath ;
	serveStatic(response, cache, absPath) ;
});

server.listen(3000, function(){
	console.log('server listening on port 3000.');
});
//加载服务端聊天功能模块
var chatServer = require('./lib/chat_server');
chatServer.listen(server) ;

//添加了一行注释