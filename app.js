
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var http = require('http').Server(app);
//var levelup = require('levelup');
var discovery = require('./samsung-discovery');
var io = require('socket.io')(http);
//var schedule = require('node-schedule');
//var AC = require('./samsung-airconditioner');
require( "console-stamp" )( console, { pattern : "dd/mm/yyyy HH:MM:ss.l" } );

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));


//function discovery(){
  var AC =  new discovery();

  AC.on('discover device', function(aircon) {
      console.log("discover: " + aircon.options.duid);

      var mac = aircon.options.duid;
      //event
      AC.devices[mac].on('connect', function () {
         //devices[mac].conncted = true;
         console.log('connect to ' + mac);
         io.emit('connect',{ id :mac, msg :'connect device'} );
       })
       .on('requestToken', function () {
         console.log('request Token button');
         io.emit('request Token',{id:mac, msg :'request Token button'} );
       })
       .on('loginSuccess', function () {
         console.log('loginSuccess');
         AC.devices[mac].isLogin = true;
         console.log(mac + ': isLogin = true (loginSuccess)');
         io.emit('login success', {id : mac, msg :'login success'});
         AC.devices[mac].status();
         //console.log(devices);
       })
       .on('stateChange', function(state) {

          for (key in state){
            AC.devices[mac].state[key] = state[key];
          }
          //console.log(devicesInfo[mac].AC_FUN_POWER);
          io.emit('state change', {id: mac, msg :state});
       })
       .on('deviceControl', function() {
          io.emit('device Control', {id : mac, msg : 'device Control OK'});
       })
       .on('end', function() {
          AC.devices[mac].conncted = false;
          AC.devices[mac].isLogin = false;
          console.log(mac + ': isLogin = false (end connect)');
          io.emit('end connect', {id: mac, msg : 'device end connect'});
          //login(mac);
          AC.devices[mac].login(AC.devices[mac].token);
       })
       .on('error', function(err) {
         AC.devices[mac].conncted = false;
         AC.devices[mac].isLogin = false;
         console.log(mac + ': isLogin = false (error)');
         io.emit('error', {id: mac, msg : err});
       })
       .on('set timer', function(msg) {
          AC.devices[mac].timer[msg.date] = msg.onoff;
          io.emit('set timer', {id :mac, date :msg.date, onoff :msg.onoff});
          console.log('set timer: ' + msg.date + ' '+ mac  + ' '+ msg.onoff);
       })
       .on('run timer', function( msg) {
          delete AC.devices[mac].timer[msg.date];
          io.emit('run timer', {id :mac, date :msg.date, onoff :msg.onoff});
       })
       .on('canceled timer', function(msg) {
          delete AC.devices[mac].timer[msg.date];
          io.emit('canceled timer', {id :mac, date :msg.date, onoff :msg.onoff});
       })
       .on('waiting', function() {
          console.log('Please power on the device within the next 30 seconds');
          io.emit('waiting power on', {mac :'Please power on the device within the next 30 seconds'});
        })
      .on('authenticated', function(token) {
            //var token = devices[mac].token;
            console.log('Token is ' + token);
            io.emit('authenticated', {id :mac , msg: 'Token is ' + token});
            setTokenDB(mac,token);
        })
      .on('GetSchedule', function(schedule) {
           console.log('get schedule: ' + schedule);
           io.emit('get schedule', {id :mac, msg : schedule});
         })
        .on('SetSchedule', function(schedule) {
            console.log('set schedule: ' + schedule);
            io.emit('set schedule', {id :mac, msg : schedule});
          })
          .on('DeleteSchedule', function(id_schedule) {
              console.log('delete schedule: ' + id_schedule);
              io.emit('delete schedule', {id :mac, msg : 'delete schedule: ' +id_schedule});
            });

      //login(mac);
      AC.devices[mac].login(AC.devices[mac].token);

    })
    .on('change ip', function(aircon) {
        var mac = aircon.options.duid;
        console.log("change ip to " + aircon.options.ip);
        //AC.devices[mac].Logout();
        //login(mac);
        AC.devices[mac].login(AC.devices[mac].token);
        io.emit('change ip',{ id :mac, msg :'change ip'} );
    });



//RESTful (send command)

function checkDevice(mac){
  if(!AC.devices[mac]){
    console.log("not fund" + AC.devices[mac])
  }
}


app.get('/devices',function(req, res){
  //console.log(AC.devices);
  //var d ={};

    res.send(JSON.stringify(AC.devices));
    //console.log(devicesInfo);
    //console.log(devicesInfo.length + " :length");
});

app.get('/api/login/:device_id',function(req, res){
    //res.send(JSON.stringify(devices));
    //console.log(req.params.device_id);
    checkDevice(req.params.device_id);
    //login(req.params.device_id);
    AC.devices[req.params.device_id].login(AC.devices[req.params.device_id].token);
    res.send("send OK");
});

app.get('/api/get_token/:device_id',function(req, res){
  checkDevice(req.params.device_id);
  AC.devices[req.params.device_id].get_token();
  res.send("send OK");
});

app.get('/api/end/:device_id',function(req, res){
  checkDevice(req.params.device_id);
  AC.devices[req.params.device_id].Logout();
  res.send("send OK");
});

app.get('/api/get_status/:device_id', function(req, res){
  checkDevice(req.params.device_id);
  AC.devices[req.params.device_id].status();
  res.send("send OK");
});

app.get('/api/on/:device_id', function(req, res){
  checkDevice(req.params.device_id);
  AC.devices[req.params.device_id].onoff('on');
  res.send("send OK");
});

app.get('/api/off/:device_id', function(req, res){
  checkDevice(req.params.device_id);
  AC.devices[req.params.device_id].off();
  res.send("send OK");
});
//modes: 'Auto', 'Cool', 'Dry', 'Wind', 'Heat'
app.get('/api/mode/:device_id/:mode', function(req, res){
  checkDevice(req.params.device_id);
  AC.devices[req.params.device_id].mode(req.params.mode);
  res.send("send OK");
});
//temp: min-16 max-30
app.get('/api/set_temp/:device_id/:temp', function(req, res){
  checkDevice(req.params.device_id);
  AC.devices[req.params.device_id].set_temperature(req.params.temp);
  res.send("send OK");
});
/*
app.get('/api/get_temp/:device_id/', function(req, res){
  checkDevice(req.params.device_id);
  devices[req.params.device_id].get_temperature();
  res.send("sent");
});
*/
// modes: 'Off', 'Quiet', 'Sleep', 'Smart', 'SoftCool', 'TurboMode', 'WindMode1', 'WindMode2', 'WindMode3'
app.get('/api/set_convenient_mode/:device_id/:mode', function(req, res){
  checkDevice(req.params.device_id);
  AC.devices[req.params.device_id].set_convenient_mode(req.params.mode);
  res.send("send OK");
});

app.get('/api/sleep_mode/:device_id/:minute', function(req, res){
  checkDevice(req.params.device_id);
  AC.devices[req.params.device_id].sleep_mode(req.params.minute);
  res.send("send OK");
});

app.get('/api/get_schedule/:device_id', function(req, res){
  checkDevice(req.params.device_id);
  AC.devices[req.params.device_id].get_schedule();
  res.send("send OK");
});

app.get('/api/delete_schedule/:device_id/:schedule_id', function(req, res){
  checkDevice(req.params.device_id);
  AC.devices[req.params.device_id].delete_schedule(req.params.schedule_id);
  res.send("send OK");
});
//type,dey,time,active, onoff
app.get('/api/set_schedule/:device_id/:types/:dey/:time/:active/:onoff', function(req, res){
  checkDevice(req.params.device_id);
  AC.devices[req.params.device_id].set_schedule(req.params.types, req.params.dey, req.params.time, req.params.active, req.params.onoff);
  res.send("send OK");
});


app.get('/api/notify', function(req, res){
  AC.emit('notify');
  res.send("send OK");
});





app.get('/api/set_time/:device_id/:time/:on_off', function(req, res){
  var d = req.params.time;
  //console.log(req.params.device_id);
  var date;
  try {
    var dd = d.split("-");
    date = new Date (dd[0],dd[1],dd[2],dd[3],dd[4],dd[5]);
    //console.log(date);
  }
  catch(err) {
    console.log("not time");
  }
  checkDevice(req.params.device_id);
  AC.devices[req.params.device_id].setTime(date, req.params.on_off);
  res.send("send OK");
});

app.get('/api/remuve_time/:device_id/:time', function(req, res){
  var d = req.params.time;
  //console.log(req.params.device_id);
  var date;
  try {
    var dd = d.split("-");
    date = new Date (dd[0],dd[1],dd[2],dd[3],dd[4],dd[5]);
    //console.log(date);
  }
  catch(err) {
    console.log("not time");
  }
  checkDevice(req.params.device_id);
  AC.devices[req.params.device_id].remuveTime(date);
  res.send("send OK");
});
///




http.listen(3001, function(){
  console.log('listening on *:3001');
});
