var events  = require('events'),
    util    = require('util'),
    fs = require('fs'),
    tls     = require('tls'),
    carrier = require('carrier'),
    schedule = require('node-schedule')
    levelup = require('levelup');



var DEFAULT_LOGGER = {
  error   : function(msg, props) { console.log(msg); if (!!props) console.trace(props.exception); },
  warning : function(msg, props) { console.log(msg); if (!!props) console.log(props);             },
  notice  : function(msg, props) { console.log(msg); if (!!props) console.log(props);             },
  info    : function(msg, props) { console.log(msg); if (!!props) console.log(props);             },
  debug   : function(msg, props) { console.log(msg); if (!!props) console.log(props);             }
};

////hex to txt nick name
function hex2txt(hex) {
  try {return decodeURIComponent(hex.replace(/(..)/g,'%$1'));} catch (e) {return "";}
}

function txtToHex(str) {
  try{
  hex = unescape(encodeURIComponent(str))
  .split('').map(function(v){
    return v.charCodeAt(0).toString(16);
  }).join('')  }
  catch(e){
    hex = str;
    console.log('invalid text input: ' + str)}
  return hex
}

//options = {ip,duid(mac),logger}
var SamsungAirconditioner = function(options) {
  var k;

  var self = this;

  if (!(self instanceof SamsungAirconditioner)) return new SamsungAirconditioner(options);

  self.options = options;

  //self.token = self.options.token;

  self.logger = self.options.logger  || {};
  for (k in DEFAULT_LOGGER) {
    if ((DEFAULT_LOGGER.hasOwnProperty(k)) && (typeof self.logger[k] === 'undefined'))  self.logger[k] = DEFAULT_LOGGER[k];
  }

  self.props = { duid : options.duid };

  self.name = hex2txt(self.options.info["NICKNAME"]);
  self.ip = self.options.ip;
  self.id = self.options.duid;
  self.isLogin = false;
  self.timer = {};
  self.state = {};
  self.token = "";
  self.getTokenDB();

  self.toJSON = function() {
    return {name:self.name,ip: self.ip, id: self.id, isLogin: self.isLogin, timer: self.timer, state: self.state};
  }


};

util.inherits(SamsungAirconditioner, events.EventEmitter);


var msga ="NOTIFY * HTTP/1.1\rnHOST: 239.255.255.250:1900\r\nCACHE-CONTROL: max-age=20\r\nSERVER: AIR CONDITIONER\r\n\r\nSPEC_VER: MSpec-1.00\r\nSERVICE_NAME: ControlServer-MLib\r\nMESSAGE_TYPE: CONTROLLER_START\r\n";




SamsungAirconditioner.prototype._connect = function() {
  var self = this;

  self.callbacks = {};

  var options_ssl = {
    key: fs.readFileSync('ssl/cert.pem'),
    cert: fs.readFileSync('ssl/cert.pem'),
    rejectUnauthorized: false,
    ciphers: "RC4"
  };

  self.socket = tls.connect( 2878,  self.options.ip, options_ssl , function() {
    self.logger.info('connected', { ipaddr: self.options.ip, port: 2878, tls: true });
    console.log("connected: " + self.options.ip);
    self.socket.setEncoding('utf8');
    self.emit('connect- ' + self.options.ip);
    self.conncted = true;
    carrier.carry(self.socket, function(line) {
      var callback, id, state;
      //self._send(msga);
      //console.log(line);
      if (line === 'DRC-1.00') {
        return;
      }

      if (line === '<?xml version="1.0" encoding="utf-8" ?><Update Type="InvalidateAccount"/>') {
        if(self.token){
          return self._send('<Request Type="AuthToken"><User Token="' + self.token + '" /></Request>');
        }
        else {
          console.log(self.options.ip + ' Request Token');
          self.emit('requestToken');
        }
      }
      //Please power on the device within the next 30 seconds'
      if (line == '<?xml version="1.0" encoding="utf-8" ?><Response Type="GetToken" Status="Ready"/>') {
        return self.emit('waiting');
      }

      // examine the line that contains the result
      if (line == '<?xml version="1.0" encoding="utf-8" ?><Response Status="Fail" Type="Authenticate" ErrorCode="301" />') {
         return callback(new Error(self.options.ip + ' Failed authentication'));
      }
      //authenticated token
      var matches = line.match(/Token="(.*)"/);
      if (matches) {
          self.token =  matches[1];
          self.emit('authenticated', self.token);
          //return callback(null, self.token);
      }
      //login AuthToken
      if (line.match(/Response Type="AuthToken" Status="Okay"/)) {
         self.emit('loginSuccess');
      }


      // Other events
      if (line.match(/Response Type="DeviceControl" Status="Okay"/)) {
         self.emit('deviceControl');
      }

      if (line.match(/Update Type="Status"/)) {
        if ((matches = line.match(/Attr ID="(.*)" Value="(.*)"/))) {
          state = {};
          state[matches[1]] = matches[2];

          self.emit('stateChange', state);
        }
      }

      if (line.match(/Response Type="DeviceState" Status="Okay"/)) {
          state = {};

          // line = '<Device DUID="7825AD103D06" GroupID="AC" ModelID="AC" ><Attr ID="AC_FUN_ENABLE" Type="RW" Value="Enable"/><Attr ID="AC_FUN_POWER" Type="RW" Value="Off"/><Attr ID="AC_FUN_SUPPORTED" Type="R" Value="0"/><Attr ID="AC_FUN_OPMODE" Type="RW" Value="NotSupported"/><Attr ID="AC_FUN_TEMPSET" Type="RW" Value="24"/><Attr ID="AC_FUN_COMODE" Type="RW" Value="Off"/><Attr ID="AC_FUN_ERROR" Type="RW" Value="00000000"/><Attr ID="AC_FUN_TEMPNOW" Type="R" Value="29"/><Attr ID="AC_FUN_SLEEP" Type="RW" Value="0"/><Attr ID="AC_FUN_WINDLEVEL" Type="RW" Value="High"/><Attr ID="AC_FUN_DIRECTION" Type="RW" Value="Fixed"/><Attr ID="AC_ADD_AUTOCLEAN" Type="RW" Value="Off"/><Attr ID="AC_ADD_APMODE_END" Type="W" Value="0"/><Attr ID="AC_ADD_STARTWPS" Type="RW" Value="Direct"/><Attr ID="AC_ADD_SPI" Type="RW" Value="Off"/><Attr ID="AC_SG_WIFI" Type="W" Value="Connected"/><Attr ID="AC_SG_INTERNET" Type="W" Value="Connected"/><Attr ID="AC_ADD2_VERSION" Type="RW" Value="0"/><Attr ID="AC_SG_MACHIGH" Type="W" Value="0"/><Attr ID="AC_SG_MACMID" Type="W" Value="0"/><Attr ID="AC_SG_MACLOW" Type="W" Value="0"/><Attr ID="AC_SG_VENDER01" Type="W" Value="0"/><Attr ID="AC_SG_VENDER02" Type="W" Value="0"/><Attr ID="AC_SG_VENDER03" Type="W" Value="0"/></Device>'

          var attributes = line.split("><");
          attributes.forEach(function(attr) {
            if ((matches = attr.match(/Attr ID="(.*)" Type=".*" Value="(.*)"/))) {
              state[matches[1]] = matches[2];
            }
          });

          self.emit('stateChange', state);
      }

      if (line.match(/Response Type="GetSchedule" Status="Okay"/)) {
          schedule = {};

          schedule = line.match(/<ScheduleInfo.*ScheduleInfo>/);
          // line = '<Device DUID="7825AD103D06" GroupID="AC" ModelID="AC" ><Attr ID="AC_FUN_ENABLE" Type="RW" Value="Enable"/><Attr ID="AC_FUN_POWER" Type="RW" Value="Off"/><Attr ID="AC_FUN_SUPPORTED" Type="R" Value="0"/><Attr ID="AC_FUN_OPMODE" Type="RW" Value="NotSupported"/><Attr ID="AC_FUN_TEMPSET" Type="RW" Value="24"/><Attr ID="AC_FUN_COMODE" Type="RW" Value="Off"/><Attr ID="AC_FUN_ERROR" Type="RW" Value="00000000"/><Attr ID="AC_FUN_TEMPNOW" Type="R" Value="29"/><Attr ID="AC_FUN_SLEEP" Type="RW" Value="0"/><Attr ID="AC_FUN_WINDLEVEL" Type="RW" Value="High"/><Attr ID="AC_FUN_DIRECTION" Type="RW" Value="Fixed"/><Attr ID="AC_ADD_AUTOCLEAN" Type="RW" Value="Off"/><Attr ID="AC_ADD_APMODE_END" Type="W" Value="0"/><Attr ID="AC_ADD_STARTWPS" Type="RW" Value="Direct"/><Attr ID="AC_ADD_SPI" Type="RW" Value="Off"/><Attr ID="AC_SG_WIFI" Type="W" Value="Connected"/><Attr ID="AC_SG_INTERNET" Type="W" Value="Connected"/><Attr ID="AC_ADD2_VERSION" Type="RW" Value="0"/><Attr ID="AC_SG_MACHIGH" Type="W" Value="0"/><Attr ID="AC_SG_MACMID" Type="W" Value="0"/><Attr ID="AC_SG_MACLOW" Type="W" Value="0"/><Attr ID="AC_SG_VENDER01" Type="W" Value="0"/><Attr ID="AC_SG_VENDER02" Type="W" Value="0"/><Attr ID="AC_SG_VENDER03" Type="W" Value="0"/></Device>'
/*
          var attributes = line.split("><");
          attributes.forEach(function(attr) {
            if ((matches = attr.match(/Attr ID="(.*)" Type=".*" Value="(.*)"/))) {
              state[matches[1]] = matches[2];
            }
          });
*/
          self.emit('GetSchedule', schedule);
      }

      if (line.match(/Response Type="SetSchedule" Status="Okay"/)) {
          var schedule = {};

          if ((matches = line.match(/DUID="(.*)" ScheduleID="(.*)"/))) {
            schedule.mac = matches[1];
            schedule.id = matches[2];
          }

          self.emit('SetSchedule', schedule);
      }

      if (line.match(/Response Type="DeleteSchedule" Status="Okay"/)) {
          var schedule_id;

          if ((schedule_id = line.match(/ScheduleID="(.*)"/))) {

          }

          self.emit('DeleteSchedule', schedule_id);
      }

      self.logger.debug('read', { line: line });

/* extract CommandID into and then... */
      if (!self.callbacks[id]) return;
      callback = self.callbacks[id];
      delete(self.callbacks[id]);

/* you may want to pass a structure instead, cf., xml2json */
      callback(null, line);
    });
  }).on('end', function() {
    self.emit('end');
    console.log('end-- ')
  }).on('error', function(err) {
    self.emit('error', err);
    console.log('error: '+ err)
  });
};

SamsungAirconditioner.prototype._device_control = function(key, value, callback) {
  var id;

  var self = this;

  if (!self.socket) throw new Error('not logged in');

  id = Math.round(Math.random() * 10000);
  if (!!callback) self.callbacks[id] = callback;

  return self._send(
    '<Request Type="DeviceControl"><Control CommandID="cmd' + id + '" DUID="' + self.options.duid + '"><Attr ID="' + key + '" Value="' + value + '" /></Control></Request>'
  );
};

SamsungAirconditioner.prototype._send = function(xml) {
  var self = this;
  if(self.conncted){
    self.logger.debug('write', { line: xml });
    self.socket.write(xml + "\r\n");
  }
  else {
    console.log('not conncted');
  }
  return self;
};


// Public API

SamsungAirconditioner.prototype.login = function(token, callback) {
  var self = this;
  if(!self.isLogin){
    if(self.socket){
      self.socket.end();
    }
    self.token = token;
    self._connect();

    //setTimeout(function() { callback(null, null); }, 0);
    //if (!!err) return console.log('login error: ' + err.message);
  }
  return self;
};



SamsungAirconditioner.prototype.get_token = function() {


  var self = this;

        if(self.conncted){
          self.socket.write('<Request Type="GetToken" />' + "\r\n");
        }

  return self;
};

SamsungAirconditioner.prototype.Logout = function() {
  var self = this;
  if(self.socket){
    self.socket.end();
  }
  self.conncted = false;
  console.log('func end Socket');
  self.emit('end');
};

// can't use ".on" (it's used by emitters)
SamsungAirconditioner.prototype.onoff = function(onoff) {
  return this._device_control('AC_FUN_POWER', onoff ? 'On' : 'Off');
};


SamsungAirconditioner.prototype.off = function() {
  return this._device_control('AC_FUN_POWER', 'Off');
};


SamsungAirconditioner.prototype.mode = function(type) {
  var i, lmodes = [];

  var modes = ['Auto', 'Cool', 'Dry', 'Wind', 'Heat'],
      self  = this;

  for (i = 0; i < modes.length; i++) lmodes[i] = modes[i].toLowerCase();
  i = lmodes.indexOf(type.toLowerCase());
  if (i === -1) throw new Error("Invalid mode: " + type);

  return self._device_control('AC_FUN_OPMODE', modes[i]);
};


SamsungAirconditioner.prototype.set_temperature = function(temp) {
  return this._device_control('AC_FUN_TEMPSET', temp);
};


SamsungAirconditioner.prototype.set_convenient_mode = function(mode) {
  var i, lmodes = [];

  var modes = ['Off', 'Quiet', 'Sleep', 'Smart', 'SoftCool', 'TurboMode', 'WindMode1', 'WindMode2', 'WindMode3'],
      self  = this;

  for (i = 0; i < modes.length; i++) lmodes[i] = modes[i].toLowerCase();
  i = lmodes.indexOf(mode.toLowerCase());
  if (i === -1) throw new Error("Invalid mode: " + mode);

  return self._device_control('AC_FUN_COMODE', mode);
};

/*
SamsungAirconditioner.prototype.get_temperature = function(callback) {
  return this._device_control('AC_FUN_TEMPNOW', '', function(err, line) {
    var celcius;

    if (!!err) callback(err);

// parse line and invoke
     callback(null, celcius);
  });
};
*/

SamsungAirconditioner.prototype.sleep_mode = function(minutes) {
  return this._device_control('AC_FUN_SLEEP', minutes);
};


SamsungAirconditioner.prototype.status = function() {
  var self = this;
  return self._send('<Request Type="DeviceState" DUID="' + self.options.duid+ '"></Request>');
};

SamsungAirconditioner.prototype.change_nickname = function(nickname){
  var self = this;
  return self._send('<Request Type="ChangeNickname"><ChangeNickname DUID="'+ self.options.duid +'"Nickname="'+ txtToHex(nickname) +'" /></Request>');
}

SamsungAirconditioner.prototype.get_schedule = function(){
  var self = this;
  return self._send('<Request Type="GetSchedule" DUID="' + self.options.duid+ '"></Request>');
}
//type: None,Once,EveryDay,WeekDays,EveryWeek dey:Sun,Mun,Tue,Wed,Thu,Fri,Sat time:10:00 active:On,Off onoff:On,Off
SamsungAirconditioner.prototype.set_schedule = function(type,dey,time,active, onoff){
  var self = this;
  var DaySelection ="";
  if(dey){DaySelection = ' DaySelection="' + dey + '"'}
  return self._send('<Request Type="SetSchedule"><ScheduleInfo ScheduleID="" Type="' + type  + '"' + DaySelection + ' Time="'+ time +'" Activate="' + active + '">  <Control DUID="' + self.options.duid+ '"><Attr ID="AC_FUN_POWER" Value="'+ onoff +'"/></Control></ScheduleInfo></Request>');
}

SamsungAirconditioner.prototype.delete_schedule = function(schedule_id){
  var self = this;
  return self._send('<Request Type="DeleteSchedule" ScheduleID="'+schedule_id+'"></Request>');
}




var jobs = [];
//timer
SamsungAirconditioner.prototype.setTime = function(date, onoff){
  var self = this;
  //var d = date.toISOString().replace(/T/, ' ').replace(/\..+/, '');
  var d = date.toLocaleString();
  //var d = date;
  //var date = new Date(2012, 11, 21, 5, 30, 0);
  jobs[date] = schedule.scheduleJob(date, function(){

    if(!self.isLogin){
      self.login(self.token,function(err) {
           if (!!err) return console.log('login error: ' + err.message);
           if(onoff == "on"){
             self.onoff('on');
             console.log(self.options.duid + " - It's time ON!");
           }
           if(onoff == "off") {
             self.off();
             console.log(self.options.duid + " - It's time OFF!");
           }
      });
    }
    else {
      if(onoff == "on"){
        self.onoff('on');
        console.log(self.options.duid + " - It's time ON!");
      }
      if(onoff == "off") {
        self.off();
        console.log(self.options.duid + " - It's time OFF!");
      }
    }
  })
  .on('run', function(){
    console.log('run timer');
    self.emit('run timer',{ date :d, onoff :onoff} );
  })
  .on('canceled', function(){
    self.emit('canceled timer',{  date :d, onoff :onoff} );
  });

  self.emit('set timer', {date: d, onoff : onoff});
}

SamsungAirconditioner.prototype.remuveTime = function(date){
  if(jobs[date]){
    jobs[date].cancel();

  }
}

var db = levelup('./mydb');

SamsungAirconditioner.prototype.setTokenDB = function(token){
  var self = this;
  db.put(self.id, token, function (err) {
      if (err) return console.log('Ooops!', err) // some kind of I/O error
      //console.log(getTokenDB(mac) + " save");
  });
}

SamsungAirconditioner.prototype.getTokenDB = function(){
  var self = this;
  db.get(self.id, function (err, value) {
    if (err) {
      if (err.notFound) {
        console.log(self.id + " Not Found Token");
        self.token = "";
        return;
      }
      //return err;
    }
    self.token = value;
    console.log(self.token  + "=" + self.id + " device Token");
    })
}




module.exports = SamsungAirconditioner;
