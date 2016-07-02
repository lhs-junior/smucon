// Muaz Khan      - www.MuazKhan.com
// MIT License    - www.WebRTC-Experiment.com/licence
// Documentation  - github.com/muaz-khan/RTCMultiConnection


module.exports = exports = function(app, socketCallback) {
    var io = require('socket.io').listen(app, {
        log: false,
        origins: '*:*'
    });

    io.set('transports', [
        'websocket', // 'disconnect' EVENT will work only with 'websocket'
        'xhr-polling',
        'jsonp-polling'
    ]);

    var listOfUsers = {};
    var shiftedModerationControls = {};
    var ScalableBroadcast;

    io.sockets.on('connection', function(socket) {
        var params = socket.handshake.query;
        var socketMessageEvent = params.msgEvent || 'RTCMultiConnection-Message';

        console.log('sd');
    
        socket.userid = params.userid;

        listOfUsers[socket.userid] = {
            socket: socket,
            connectedWith: {},
            isPublic: false, // means: isPublicModerator
            extra: {}
        };

      //페이지 넘기기 
        socket.on('next-Page', function(info) {
        	console.log(info.openid);
        	var data = info.openid;
        	socket.emit('nextp',data);
        });
        /*
        //데이터베이스 목록확인
        socket.on('db-roomlist', function() {
            var roomlistinfo = new Array();
            dbConnection.query('select RoomNo from roomlist', function (error, result, fields) {
            	if (!error) {
            		
            		for(idx in result){
                       roomlistinfo[idx]=result[idx].RoomNo;
                    }
            		
            		socket.emit('get-roomlist', roomlistinfo);
            	 }
            	 else{
            		 console.log('쿼리 문장에 오류가 있습니다.');
            		 console.log(error);
            	 }
            });
        });
      //데이터베이스 저장
        socket.on('db-store', function(dbinfo) {
            var ids = dbinfo.openid;
            var inputdb = {
            		RoomNo: ids,
            		PageNo:"1",
            		MaxPageNO:"1",
            		OnOff:"off",
            		HostId: "test"
            };
            var checkid =0;
            dbConnection.query('select RoomNo from roomlist', function (error, result, fields) {
            	if (!error) {
            		
            		for(idx in result){
            			if( ids==result[idx].RoomNo)
            				{
            				   checkid = 1;
            				   socket.emit('roomid-overlap',1);	
            				}
                    }
            		
            	 }
            	 else{
            		 console.log('쿼리 문장에 오류가 있습니다.');
            		 console.log(error);
            	 }
            });
            
            if(checkid==0){
	            dbConnection.query('insert into roomlist SET ?',inputdb, function (error, result, fields) {
	            	 if (!error) {      		
	            		 socket.emit('roomid-overlap',0);	
	            	 }
	            	 else{
	            		 console.log('쿼리 문장에 오류가 있습니다.');
	            		 console.log(error);
	            	 }
	            });
            }
      
        });
        */
        socket.on('right',function(data){
        	socket.broadcast.emit('tossRight',{current:data.current});
        	console.log(오른쪽);
        });
        
        socket.on('left',function(data){
        	socket.broadcast.emit('tossLeft',{current:data.current});
        	//console.log("왼쪽 보낸거 받고 보냄");
        });


        socket.on('convertOK',function(data){
        	//console.log(data.success);
        	if(data.success==="success"){
        		console.log("good123");
        		socket.broadcast.emit('pagechange',{data:data});
        	}
        	else{
        		console.log("fail");
        		socket.emit('fail',{data:data});
        	}
        		
        	
        });
        
        socket.on('extra-data-updated', function(extra) {
            try {
                if (!listOfUsers[socket.userid]) return;
                listOfUsers[socket.userid].extra = extra;

                for (var user in listOfUsers[socket.userid].connectedWith) {
                    listOfUsers[user].socket.emit('extra-data-updated', socket.userid, extra);
                }
            } catch (e) {}
        });

        socket.on('become-a-public-moderator', function() {
            try {
                if (!listOfUsers[socket.userid]) return;
                listOfUsers[socket.userid].isPublic = true;
            } catch (e) {}
        });

        socket.on('dont-make-me-moderator', function() {
            try {
                if (!listOfUsers[socket.userid]) return;
                listOfUsers[socket.userid].isPublic = false;
            } catch (e) {}
        });

        socket.on('get-public-moderators', function(userIdStartsWith, callback) {
            try {
                userIdStartsWith = userIdStartsWith || '';
                var allPublicModerators = [];
                for (var moderatorId in listOfUsers) {
                    if (listOfUsers[moderatorId].isPublic && moderatorId.indexOf(userIdStartsWith) === 0 && moderatorId !== socket.userid) {
                        var moderator = listOfUsers[moderatorId];
                        allPublicModerators.push({
                            userid: moderatorId,
                            extra: moderator.extra
                        });
                    }
                }

                callback(allPublicModerators);
            } catch (e) {}
        });

        socket.on('changed-uuid', function(newUserId) {
            try {
                if (listOfUsers[socket.userid] && listOfUsers[socket.userid].socket.id == socket.userid) {
                    if (newUserId === socket.userid) return;

                    var oldUserId = socket.userid;
                    listOfUsers[newUserId] = listOfUsers[oldUserId];
                    listOfUsers[newUserId].socket.userid = socket.userid = newUserId;
                    delete listOfUsers[oldUserId];
                    return;
                }

                socket.userid = newUserId;
                listOfUsers[socket.userid] = {
                    socket: socket,
                    connectedWith: {},
                    isPublic: false,
                    extra: {}
                };
            } catch (e) {}
        });

        socket.on('set-password', function(password) {
            try {
                if (listOfUsers[socket.userid]) {
                    listOfUsers[socket.userid].password = password;
                }
            } catch (e) {}
        });

        socket.on('disconnect-with', function(remoteUserId, callback) {
            try {
                if (listOfUsers[socket.userid] && listOfUsers[socket.userid].connectedWith[remoteUserId]) {
                    delete listOfUsers[socket.userid].connectedWith[remoteUserId];
                    socket.emit('user-disconnected', remoteUserId);
                }

                if (!listOfUsers[remoteUserId]) return callback();

                if (listOfUsers[remoteUserId].connectedWith[socket.userid]) {
                    delete listOfUsers[remoteUserId].connectedWith[socket.userid];
                    listOfUsers[remoteUserId].socket.emit('user-disconnected', socket.userid);
                }
                callback();
            } catch (e) {}
        });

        function onMessageCallback(message) {
            try {
                if (!listOfUsers[message.sender]) {
                    socket.emit('user-not-found', message.sender);
                    return;
                }

                if (!listOfUsers[message.sender].connectedWith[message.remoteUserId] && !!listOfUsers[message.remoteUserId]) {
                    listOfUsers[message.sender].connectedWith[message.remoteUserId] = listOfUsers[message.remoteUserId].socket;
                    listOfUsers[message.sender].socket.emit('user-connected', message.remoteUserId);

                    if (!listOfUsers[message.remoteUserId]) {
                        listOfUsers[message.remoteUserId] = {
                            socket: null,
                            connectedWith: {},
                            isPublic: false,
                            extra: {}
                        };
                    }

                    listOfUsers[message.remoteUserId].connectedWith[message.sender] = socket;

                    if (listOfUsers[message.remoteUserId].socket) {
                        listOfUsers[message.remoteUserId].socket.emit('user-connected', message.sender);
                    }
                }

                if (listOfUsers[message.sender].connectedWith[message.remoteUserId] && listOfUsers[socket.userid]) {
                    message.extra = listOfUsers[socket.userid].extra;
                    listOfUsers[message.sender].connectedWith[message.remoteUserId].emit(socketMessageEvent, message);
                }
            } catch (e) {}
        }

        var numberOfPasswordTries = 0;
        socket.on(socketMessageEvent, function(message, callback) {
            if (message.remoteUserId && message.remoteUserId === socket.userid) {
                // remoteUserId MUST be unique
                return;
            }

            try {
                if (message.remoteUserId && message.remoteUserId != 'system' && message.message.newParticipationRequest) {
                    if (listOfUsers[message.remoteUserId] && listOfUsers[message.remoteUserId].password) {
                        if (numberOfPasswordTries > 3) {
                            socket.emit('password-max-tries-over', message.remoteUserId);
                            return;
                        }

                        if (!message.password) {
                            numberOfPasswordTries++;
                            socket.emit('join-with-password', message.remoteUserId);
                            return;
                        }

                        if (message.password != listOfUsers[message.remoteUserId].password) {
                            numberOfPasswordTries++;
                            socket.emit('invalid-password', message.remoteUserId, message.password);
                            return;
                        }
                    }
                }

                if (message.message.shiftedModerationControl) {
                    if (!message.message.firedOnLeave) {
                        onMessageCallback(message);
                        return;
                    }
                    shiftedModerationControls[message.sender] = message;
                    return;
                }

                if (message.remoteUserId == 'system') {
                    if (message.message.detectPresence) {
                        if (message.message.userid === socket.userid) {
                            callback(false, socket.userid);
                            return;
                        }

                        callback(!!listOfUsers[message.message.userid], message.message.userid);
                        return;
                    }
                }

                if (!listOfUsers[message.sender]) {
                    listOfUsers[message.sender] = {
                        socket: socket,
                        connectedWith: {},
                        isPublic: false,
                        extra: {}
                    };
                }

                // if someone tries to join a person who is absent
                if (message.message.newParticipationRequest) {
                    var waitFor = 120; // 2 minutes
                    var invokedTimes = 0;
                    (function repeater() {
                        invokedTimes++;
                        if (invokedTimes > waitFor) {
                            socket.emit('user-not-found', message.remoteUserId);
                            return;
                        }

                        if (listOfUsers[message.remoteUserId] && listOfUsers[message.remoteUserId].socket) {
                            onMessageCallback(message);
                            return;
                        }

                        setTimeout(repeater, 1000);
                    })();

                    return;
                }

                onMessageCallback(message);
            } catch (e) {}
        });

        socket.on('disconnect', function() {
            try {
                var message = shiftedModerationControls[socket.userid];

                if (message) {
                    delete shiftedModerationControls[message.userid];
                    onMessageCallback(message);
                }
            } catch (e) {}

            try {
                // inform all connected users
                if (listOfUsers[socket.userid]) {
                    for (var s in listOfUsers[socket.userid].connectedWith) {
                        listOfUsers[socket.userid].connectedWith[s].emit('user-disconnected', socket.userid);

                        if (listOfUsers[s] && listOfUsers[s].connectedWith[socket.userid]) {
                            delete listOfUsers[s].connectedWith[socket.userid];
                            listOfUsers[s].socket.emit('user-disconnected', socket.userid);
                        }
                    }
                }
            } catch (e) {}

            delete listOfUsers[socket.userid];
        });

        if (socketCallback) {
            socketCallback(socket);
        }
    });
};
