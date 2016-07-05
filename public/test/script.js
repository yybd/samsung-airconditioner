
//BC8CCDC927E2/Once/Sun/00:30/On/On
function parseDevice(){
	$('#list').empty();
  console.log(Object.keys(devices).length);
  $.each( devices, function( i, device ){
    //console.log(device.id);
    $('#list').append('<li id="' + device.id +  '" >'
    + device.ip + " "
    + '<b>' +device.name + " </b>"
		+ 'login: ' + device.isLogin
    +'<button onclick="getToken(parentNode.id)"" disabled="'+ device.isLogin+'">Get token</button>'
    +'<button onclick="login(parentNode.id)">Login</button>'
		+'<button onclick="loginEnd(parentNode.id)">LoginOFF</button>'
    +'<button onclick="getStatus(parentNode.id)">get status</button>'
    //+'<button onclick="getTemp(parentNode.id)">get temp</button>'
    +'<button onclick="onDevice(parentNode.id)">on</button>'
    +'<button onclick="offDevice(parentNode.id)">off</button>'
		+'<button class="" onclick="getSchedule(parentNode.id)"  ">get schedule</button>'
		+'<button class="on" id="' + device.id +  '" data-field="datetime" >time on</button>'
		+'<button class="off" id="' + device.id +  '" data-field="datetime" >time off</button>'
		+'<button class="remuveTime" id="' + device.id +  '" data-field="datetime" >remuve timer</button>'
		+	'<input type="text" size="2" value="' + device.state.AC_FUN_TEMPSET +'" ondblclick="setTemp(parentNode.id,this.value)">' +'</input>'
		+'<select value="'+ device.state.AC_FUN_OPMODE +'" onchange="mode(parentNode.id,this.value)"><option value="Auto">Auto</option><option value="Cool">Cool</option><option value="Dry">Dry</option><option value="Wind">Wind</option>option value="Heat">Heat</option></select>'
		+'<div class="info">POWER: ' + device.state.AC_FUN_POWER + '</div>'
	//	+'<div class="info">TEMPSET: ' + device.AC_FUN_TEMPSET + '</div>'
		+'<div class="info">MODE: ' + device.state.AC_FUN_OPMODE + '</div>'
		+'<div class="info">TEMP NOW: ' + device.state.AC_FUN_TEMPNOW + '</div>'
		//timer
		+'<div><option value="None">None</option><option value="Once">Once</option><option value="EveryDay">EveryDay</option><option value="WeekDays">WeekDays</option><option value="EveryWeek">EveryWeek</option>'
		+'<div><option value="Sun">Sun</option><option value="Mun">Mun</option><option value="Tue">Tue</option><option value="Wed">Wed</option><option value="Thu">Thu</option><option value="Fri">Fri</option><option value="Sat">Sat</option>'
		+'<input type="text"></input> </div>'
		+'<div><option value="On">On</option><option value="Off">Off</option>'
		+'<div><option value="On">On</option><option value="Off">Off</option>'
		//type: None,Once,EveryDay,WeekDays,EveryWeek dey:Sun,Mun,Tue,Wed,Thu,Fri,Sat time:10:00 active:On,Off onoff:On,Off


		+ parseTimer(device)
    +'</li>');
		//AC_OUTDOOR_TEMP = (value - 32) * 5) / 9);
		//device.on--timer= data
		//device.off--timer= data
  //  console.log(htmlDevide(device.options.duid,device.name));
  //  $('#devices').append(htmlDevide(device.options.duid,device.name));
  });
}

function parseTimer(device){

	var html ='';
	if(device.timer){
		$.each(device.timer ,function( i, timer ){
			//var tt = i.getHours() + ":" + i.getMinutes();
			//var tt = new date(i);
			//var t= i.replace(/T/, ' ').replace(/\..+/, '');
			//var date = new Date(i + 'UTC');
			//html += '<div>'+ timer  + ' : ' + ToLocalDate(i) +'</div>';
			html += '<div>'+ timer  + ' : ' + i +'</div>';
		}
	)}
	return html;
}

function ToLocalDate(date1)
{
	var newDate = new Date();
  var ary = date1.split(" ");
  var ary2 = ary[0].split("-");
  var ary1 = ary[1].split(":");
	newDate.setUTCHours(parseInt(ary1[0]));
  newDate.setUTCMinutes(ary1[1]);
  newDate.setUTCSeconds(ary1[2]);
  newDate.setUTCFullYear(ary2[0]);
  newDate.setUTCMonth(ary2[1]);
  newDate.setUTCDate(ary2[2]);
	var t = newDate.getDate() + "-" + newDate.getMonth() + "-" + newDate.getFullYear() + " " + newDate.getHours() + ":" + newDate.getMinutes();
	return newDate.toLocaleString();
	//return t;
}
/*
function parseStatus(){

}

function htmlDevide(id,name){
  return  '<div class="device" id="">'+
     '<label id="' + name + '" onclick="login('+id+')">' + name + '</label>'+
     '<label id="login"></label>'+
     '<div id="">'+
       '<div class="button off glyphicon glyphicon-off" id="off" onclick="offDevice("'+id+'")"></div>'+
       '<div class="button on glyphicon glyphicon-off" id="on" onclick="onDevice('+id+')"></div>'+
       '<div ('+id+'="mod">'+
         '<div class="button on" id="Auto" onclick="mode('+id+',Auto)">Auto</div>'+
         '<div class="button off" id="Cool" onclick="mode('+id+',Cool)">Cool</div>'+
         '<div class="button off" id="Dry" onclick="mode('+id+',Dry)">Dry</div>'+
         '<div class="button off" id="Wind" onclick="mode('+id+',Wind)">Wind</div>'+
         '<div class="button off" id="Heat" onclick="mode('+id+',Heat)">Heat</div>'+
       '</div>'+
       '<div id="temp">'+
         '<input type="range" id="setTemp" min="16" max="30" oninput="" onchange="setTemp('+id+',this.value)">'+
         '<label for="setTemp" id="getTemp">16</label>'+
       '</div>'+
     '</div>'+
   '</div>';
}
*/

function activeDateTimePicker(){
	$("#dtBox").DateTimePicker({
		language:"he",
		settingValueOfElement: function(sValue, dValue, oInputElement)
			{
				var id = oInputElement.attr('id');
				var clss = oInputElement.attr('class');
				if(clss != 'remuveTime'){
					setTime(id, dValue, clss)
				}
				else {
					remuveTime(id, dValue);
					//console.log('remove')
				}
				//console.log("settingValueOfElement : " + dValue + oInputElement.attr('id'));
			}
	});
}




$( document ).ready(function() {
  //getDvices();
	activeDateTimePicker()
  //parseDevice();
	getDvices(parseDevice);
	//slider();
});




//angolar

var myApp = angular.module("myApp",[]);
myApp.controller("mainController",function($scope){
    //Controller code inside here
});
