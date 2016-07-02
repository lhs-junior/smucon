// Muaz Khan      - www.MuazKhan.com
// MIT License    - www.WebRTC-Experiment.com/licence
// Documentation  - github.com/muaz-khan/RTCMultiConnection

var isUseHTTPs = !(!!process.env.PORT || !!process.env.IP);

var server = require(isUseHTTPs ? 'https' : 'http'),
url = require('url'),
path = require('path'),
fs = require('fs'),
formidable = require('formidable'),
child = require('child_process'),
util = require('util');
express = require('express'),
multiparty = require('connect-multiparty'),
cookieParser = require('cookie-parser'),
bodyParser = require('body-parser'),
mysql = require('mysql');
var exp = express();

exp.use(cookieParser());
exp.use(bodyParser.json({limit:'10mb'}));
//exp.use(multiparty({uploadDir:__dirname+'/multipart'}));
exp.use(express.static(__dirname+'/'));
exp.use(express.static(path.join(__dirname,'Test_views')));
exp.use(bodyParser.urlencoded({
    extended: true
}));
//young chan
//var routes = require('./routes/index');


/*  범이 이것도 풀어
app.use(session({
	key : 'Smu',
	secret : 'keyboard cat',
	cookie : {
		maxAge : 36000
	},
	resave : false,
	saveUninitializaed : true
}))


app.use(cookieParser());*/


var dbConnection = mysql.createConnection({   
    host: '127.0.0.1', 
    user: 'root',   
    password: '1234',   
    database: 'smucon2'
   });


var fie;
var roomname;
var checkDbArr = new Array(1000);

var form = new formidable.IncomingForm(),
files = [],
fields = [];
form.uploadDir = 'C:/Users/405/workspace/smucon2/multipart';
//생성되어 있는 룸 번호를 배열에 저장. 

dbConnection.query('select RoomNo from roomlist', function (error, result, fields) {
	if (!error) {
		
		for(idx in result){
         checkDbArr[result[idx].RoomNo]=1;
      }
	 }
	 else{
		 console.log('쿼리 문장에 오류가 있습니다.');
		 console.log(error);
	 }
});
exp.get('/',function(req,res){
	fs.readFile('Test_views/index.html',function(error,data){
		res.send(data.toString());
	});
});
exp.post('/room_join',function(request,response){

	//console.log("바디조인꺼"+request.body.join);
	roomname = request.body.join;
	//console.log(roomname);
	if(roomname=='' && request.body=='undefined'){
		console.log('방 없어요 쓰바꺼');
	}else{
      	//roomname으로 데이터베이스에서 값 확인후 값이 있을때 (방이 있다) Join.
      	//dbConnection.connect();
		//var field = 'join';
		//var value = roomname;
      	dbConnection.query('select * from roomlist where RoomNo='+roomname+'', function (error, result, fields) {
          	if (!error) {	
          		if(result=='')
          		{
          			console.log("조인 할 방이 없다.");
          		}
          		else{           			                     
	            		console.log('조인한다.');
	            		console.log(result[0].PDF);
	            		
	                	//fields.push([field, value]);     
	                    fs.readFile('Test_views/ViewerRtc.html','binary',function(err,file){
	                    	console.log("aa");
	                        response.writeHead(200);
	                        response.write(file, 'binary');	                       	                      
	                        response.end(
	                        		'<script>var DEFAULT_URL = "../multipart/'+result[0].PDF+'.pdf"; var roomname ='+result[0].RoomNo+';var state="join";</script>'	                      		
	                        );
	                        
	                    });	       
	                    
	                    
	                    console.log("통과?");
          		}           		
          	 }
          	 else{
          		 console.log('쿼리 문장에 오류가 있습니다.');
          		 console.log(error);
          	 }
          });
      	//dbConnection.end();		
	}
		
	
    

      
      
});

exp.post('/room_make',function(request,response){
  	//console.log("들어는 올게");

form
 .on('file', function(field, file) {
	 
	  console.log('file name='+file.name);   	 
	  console.log("방이 만들어진다?.");
 	 
 	
	  var checkDB=1; 
	  
	  while(checkDB!=0)
	  {
		  var rans =  Math.floor(Math.random() * 999)+ 1;
	      roomname = rans;
	      
		  
		  if(checkDbArr[roomname]!=1)
		  {
			 checkDB=0;  	
			 checkDbArr[roomname]=1;
		  }   		  
	  }
	  
	 
	  if(file.name =='')
		  {
		  	console.log('no file ');
		  	
		  }
	  else{
	        console.log(field, file);
	        files.push([field, file]);
	        //java convert 부분 //
	
	        var filepath = file.path;
	       
	        console.log(roomname);

	        var java = child.spawn('java',['-cp','.;C:/test/itextpdf-5.4.1.jar;C:/test/poi-3.11.jar;C:/test/poi-examples-3.11.jar;C:/test/poi-excelant-3.11.jar;C:/test/poi-ooxml-3.11.jar;C:/test/poi-ooxml-schemas-3.11.jar;C:/test/poi-scratchpad-3.11.jar;C:/test/xmlbeans-5.1.6.jar','ConvertPPT',filepath,roomname],{stdio:[ 'pipe',null,null, 'pipe' ]});
	        java.stdout.on('data', function(data){
	            console.log("[java]"+data.toString());
	        });        
	         //방생성 할 때 값 데이터베이스에 넣기          -> 추후 디렉토리 생성 될떄 변경                         
	        
	        var inputdb = {
	            		RoomNo: roomname,
	            		RoomName:"",
	            		PDF: roomname,
	            		on_off:"on"
	         };
	            
	        dbConnection.query('insert into roomlist SET ?',inputdb, function (error, result, fields) {
		       	 if (!error) {      		
		    			console.log('방이 생성됨.');
		       	 }
		       	 else{
		       		 console.log('쿼리 문장에 오류가 있습니다.');
		       		 console.log(error);
		       	 }
	        });
	        
	        java.stdout.on('end',function(){
	            //console.log('filename ---> '+filename);
	            fs.readFile('C:/Users/405/workspace/smucon2/Test_views/ViewerRtc.html','binary',function(err,file){
	                response.writeHead(200);
	                response.write(file, 'binary');
	                response.end(
	                		'<script>var DEFAULT_URL = "../multipart/'+roomname+'.pdf"; var roomname ='+roomname+';var state="open";</script>'
	                		//'<script>location.href="/Test_views";</script>'
	                );

	            });
		   });
			  
		   java.stdin.end();
	  }
   //java convert end //

 })
 .on('end', function(field, file) {
   console.log('-> upload done');
   /*
   response.writeHead(200, {'content-type': 'text/plain'});
   response.write('received fields:\n\n '+util.inspect(fields));
   response.write('\n\n');
   response.end('received files:\n\n '+util.inspect(files));
   
   
   
   fs.readFile('ViewerRtc.html','binary',function(err,file){
       response.writeHead(200);
       response.write(file, 'binary');
       response.end();
   });
   */
   
 });
 console.log("end");

form.parse(request);
	
	
	
	
	/*	fs.readFile(req.files.upload.path,function(err,data){
		var filepath = __dirname + '/multipart/'+ req.files.upload.name;
		console.log(filepath);
		fs.writeFile(filepath,data,function(err){
			if(err){
				throw err;
			}
			else{
				res.send(filepath);
			}
		});
	});*/
});


/*
 * 
 * app.use(session({
	secret: 'keyboard cat', // 세션키
	resave: false,
	saveUninitialized: true
}));

app.use(session({
	key: 'sid', // 세션키
	secret: 'secret', //비밀키
	cookie:{
		maxAge: 1000 * 60 * 60 //쿠키 유효기간 1시간
	}
}));
*/


var checkDbArr = new Array(1000);
//생성되어 있는 룸 번호를 배열에 저장. 
dbConnection.query('select RoomNo from roomlist', function (error, result, field) {
	if (!error) {
		
		for(idx in result){
           checkDbArr[result[idx].RoomNo]=1;
        }
	 }
	 else{
		 console.log('쿼리 문장에 오류가 있습니다.');
		 console.log(error);
	 }
});


var app;

if (isUseHTTPs) {
    var options = {
        key: fs.readFileSync(path.join(__dirname, 'fake-keys/privatekey.pem')),
        cert: fs.readFileSync(path.join(__dirname, 'fake-keys/certificate.pem'))
    };
    app = server.createServer(options, exp);
} else app = server.createServer(exp);

app = app.listen(process.env.PORT || 1220, process.env.IP || "203.237.183.107", function() {
    var addr = app.address();
    console.log("Server listening at", addr.address + ":" + addr.port);
});

require('./Signaling-Server.js')(app, function(socket) {
    try {
        var params = socket.handshake.query;

        // "socket" object is totally in your own hands!
        // do whatever you want!

        // in your HTML page, you can access socket as following:
        // connection.socketCustomEvent = 'custom-message';
        // var socket = connection.getSocket();
        // socket.emit(connection.socketCustomEvent, { test: true });

        if (!params.socketCustomEvent) {
            params.socketCustomEvent = 'custom-message';
        }

        socket.on(params.socketCustomEvent, function(message) {
            try {
                socket.broadcast.emit(params.socketCustomEvent, message);
            } catch (e) {}
        });
    } catch (e) {}
});
