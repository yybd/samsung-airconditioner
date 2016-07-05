var devices = {};

var socket = io();

//devices: {id:{device.options.duid,device.options.ip,device.name}}
function getDvices(parse) {

  $.get("/devices", function(data, status){
    devices = $.parseJSON(data);
    //console.log(devices);
    parse();
  });


}

function getDvices2(parse) {

  $.get("/devices", function(data, status){
    devices = $.parseJSON(data);
    //console.log(devices);
    parse();
  });


}


//send messages
function notify(){
  $.get("/api/notify" , function(data, status){});
}
function getToken(id){
  $.get("/api/get_token/" + id, function(data, status){});
}
function login(id){
  $.get("/api/login/" + id, function(data, status){});
}
function loginEnd(id){
  $.get("/api/end/" + id, function(data, status){});
}
function getStatus(id){
  $.get("/api/get_status/" + id, function(data, status){});
}
function onDevice(id){
  $.get("/api/on/" + id, function(data, status){});
}
function offDevice(id){
  $.get("/api/off/" + id, function(data, status){});
}
//modes: 'Auto', 'Cool', 'Dry', 'Wind', 'Heat'
function mode(id, mode){
  $.get("/api/mode/" + id + "/" + mode, function(data, status){});
  //console.log("jj")
}
//temp: min-16 max 30
function setTemp(id, temp){
  $.get("/api/set_temp/" + id + "/" + temp, function(data, status){});
}

// modes: 'Off', 'Quiet', 'Sleep', 'Smart', 'SoftCool', 'TurboMode', 'WindMode1', 'WindMode2', 'WindMode3'
function setConvenientMode(id, mode){
  $.get("/api/set_convenient_mode/" + id + "/" + mode, function(data, status){});
}
function sleepMode(id,minute){
  $.get("/api/sleep_mode/" + id + "/" + minute, function(data, status){});
}
//onoff= "on"/"off"
function setTime(id,date,onoff){
  var d = date.getFullYear() + '-' + date.getMonth() + '-' + date.getDate() + '-' + date.getHours() + '-' + date.getMinutes() + '-' + date.getSeconds();
  //console.log(d + ":" + id);
  $.get("/api/set_time/" + id + "/" + d + "/" + onoff, function(data, status){});
}
function remuveTime(id,date){
  var d = date.getFullYear() + '-' + date.getMonth() + '-' + date.getDate() + '-' + date.getHours() + '-' + date.getMinutes() + '-' + date.getSeconds();
  //console.log(d + ":" + id);
  $.get("/api/remuve_time/" + id + "/" + d , function(data, status){});
}
function getSchedule(id){
  //console.log(d + ":" + id);
  $.get("/api/get_schedule/" + id  , function(data, status){});
}
function setSchedule(id, type, dey, time, active, onoff){
  //console.log(d + ":" + id); //type: None,Once,EveryDay,WeekDays,EveryWeek dey:Sun,Mun,Tue,Wed,Thu,Fri,Sat time:10:00 active:On,Off onoff:On,Off
  $.get("/api/set_schedule/" + id + "/" + type +"/" + dey +"/" + time +"/" + active +  "/" + onoff , function(data, status){});
}

function deleteSchedule(id, id_schedule){
  //console.log(d + ":" + id);
  $.get("/api/delete_schedule/" + id + "/" + id_schedule , function(data, status){});
}


/*
function _id(msg){
  return Object.keys(msg)[0];
}
*/
//get messages
//socket.on('discover', function(msg){
///    $('#messages').append($('<li>').text(msg.name + " discover"));
    //devices[msg.options.duid] = msg;
//  });

socket.on('connect', function(v){
    //$('#messages').append($('<li>').text(JSON.stringify(v.id + ":" + v.msg)));
  });

socket.on('end connect', function(v){
    $('#messages').append($('<li>').text(devices[v.id].name + ":" + JSON.stringify( v.msg)));
    devices[v.id]['isLogin'] = false;
    try{parseDevice();}  catch(e){}
  });

socket.on('login success', function(v){
    $('#messages').append($('<li>').text(devices[v.id].name + ":" + JSON.stringify(v.msg)));
    //var id = Object.keys(msg)[0];
    if(devices[v.id]){
      devices[v.id]['isLogin'] = true;
    }
    try{parseDevice();}  catch(e){}
    try{loadDevices();}  catch(e){}
  });

socket.on('state change', function(v){
    $('#messages').append($('<li>').text(devices[v.id].name + ":" + JSON.stringify(v.msg)));
    //var id = _id(msg);
    if(devices[v.id]){
      $.map(v.msg, function (value, key){
          devices[v.id]['state'][key] = value;
      });
    }

    try{parseDevice();}  catch(e){}
    try{loadDevices();}  catch(e){}

  });

socket.on('error', function(v){
    $('#messages').append($('<li>').text(devices[v.id].name + ": error: " + JSON.stringify(v.msg)));
    devices[v.id]['isLogin'] = false;
    try{parseDevice();}  catch(e){}
    try{loadDevices();}  catch(e){}
  });

socket.on('request Token', function(v){
   $('#messages').append($('<li>').text(devices[v.id].name + ":" + JSON.stringify(v.msg)));
 });

socket.on('waiting power on', function(v){
    $('#messages').append($('<li>').text(devices[v.id].name + ":" + JSON.stringify(v.msg)));
  });

socket.on('authenticated', function(v){
    $('#messages').append($('<li>').text(devices[v.id].name + ":" + JSON.stringify(v.msg)));
  });

  socket.on('get schedule', function(v){
      $('#messages').append($('<li>').text(devices[v.id].name + ":" + JSON.stringify(v.msg)));
    });

  socket.on('set schedule', function(v){
        $('#messages').append($('<li>').text(devices[v.id].name + ":" + JSON.stringify(v.msg)));
      });

  socket.on('delete schedule', function(v){
            $('#messages').append($('<li>').text(devices[v.id].name + ":" + JSON.stringify(v.msg)));
          });





socket.on('set timer', function(v){
    $('#messages').append($('<li>').text(devices[v.id].name + ":" + JSON.stringify(v.date + ": " + v.onoff)));

    devices[v.id].timer[v.date] = v.onoff;
    //console.log(devices[v.id]);

    try{parseDevice();}  catch(e){}


  });


  socket.on('run timer', function(v){
      $('#messages').append($('<li>').text(devices[v.id].name + ":" + JSON.stringify(v.date + ": " + v.onoff)));

      delete devices[v.id].timer[v.date];
      try{parseDevice();}  catch(e){}

    });

    socket.on('canceled timer', function(v){
        $('#messages').append($('<li>').text('canceled timer:' + devices[v.id].name + ":" + JSON.stringify(v.date+ ": " + v.onoff)));

        delete devices[v.id].timer[v.date];
        try{parseDevice();}  catch(e){}

      });


  /*
function setStatus(json, id){


  devices[id].AC_FUN_POWER;
  devices[id].AC_FUN_OPMODE;
  devices[id].AC_FUN_TEMPSET;
  devices[id].AC_FUN_COMODE;
  devices[id].AC_FUN_ERROR;
  devices[id].AC_FUN_TEMPNOW;
  devices[id].AC_FUN_SLEEP;
  devices[id].AC_FUN_WINDLEVEL;
  devices[id].AC_FUN_DIRECTION;
  devices[id].AC_ADD_AUTOCLEAN;
  devices[id].AC_ADD_SETKWH;
  devices[id].AC_ADD_CLEAR_FILTER_ALARM;
  devices[id].AC_ADD_APMODE_END;
  devices[id].AC_ADD_STARTWPS;
  devices[id].AC_ADD_SPI;
  devices[id].AC_OUTDOOR_TEMP;
  devices[id].AC_COOL_CAPABILITY;
  devices[id].AC_WARM_CAPABILITY;
  devices[id].AC_SG_WIFI;
  devices[id].AC_SG_INTERNET;
  devices[id].AC_ADD2_USEDWATT;
  devices[id].AC_ADD2_VERSION;
  devices[id].AC_SG_MACHIGH;
  devices[id].AC_SG_MACMID;
  devices[id].AC_SG_MACLOW;
  devices[id].AC_SG_VENDER01;
  devices[id].AC_SG_VENDER02;
  devices[id].AC_SG_VENDER03;
  devices[id].AC_ADD2_PANEL_VERSION;
  devices[id].AC_ADD2_OUT_VERSION;
  devices[id].AC_FUN_MODEL;
  devices[id].AC_ADD2_OPTIONCODE;
  devices[id].AC_ADD2_USEDPOWER;
  devices[id].AC_ADD2_USEDTIME;
  devices[id].AC_ADD2_CLEAR_POWERTIME;
  devices[id].AC_ADD2_FILTERTIME;
  devices[id].AC_ADD2_FILTER_USE_TIME;



  console.log(devices[id].AC_FUN_POWER);
  console.log(devices[id].AC_FUN_TEMPSET);

}
*/
