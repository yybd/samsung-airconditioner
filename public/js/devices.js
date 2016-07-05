
$( document ).ready(function() {
  getDvices2(loadDevices);
  //$("#list").loadTemplate("device.html",devices);



});


  function loadDevices() {

    var date = {devices:
      $.map( devices , function( value, key ) {return value;})
    };

    $.get('device.html', function(template) {
      var rendered = Mustache.render(template, date);
      $('#list').html(rendered);

      $(".glyphicon-off").on("click", function(){
        if($(this).hasClass('On')){
          offDevice($(this).attr('data-id'));
          $(this).css('color','#000066');
          $('#messages').append($('<li>').text('off' ));
        }
        if($(this).hasClass('Off')){
          onDevice($(this).attr('data-id'));
          $(this).css('color','#000066');
          $('#messages').append($('<li>').text('on: ' + $(this).attr('id')));
        }
      });

      $(".device2").on("click", function(){
        if($(this).hasClass('false')){
          login($(this).attr('id'));
          $('#messages').append($('<li>').text('login: '+$(this).attr('id')));
        }
      });


    });


  }
