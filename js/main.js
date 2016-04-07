$(document).ready(function() {
  "use strict";

  var SerialPort = require("browser-serialport").SerialPort;
  var serialPort;

  // Get the current window
  var win = nw.Window.get();
  // Show the dev tools at app startup
  win.showDevTools();


  //
  //Comm port selection
  //
  var comm_port_dialog = document.querySelector('#comm_port_select');
  document.querySelector('#dialog_comm_port_select').addEventListener('click', function() {
    //get the list of available comm ports if any
    require("browser-serialport").list(function(err, ports) {
      if(ports.length > 0){
        //display the comm port select dialog
        comm_port_dialog.showModal();

        //put a radio button for each available comm port
        ports.forEach(function(port) {
          console.log(port.comName);
        });
      }else{
        notification('alert', 'Unable to find any comm ports');
      }
    });
  });

  comm_port_dialog.querySelector('#comm_port_select_close').addEventListener('click', function() {
    comm_port_dialog.close();
  });

  comm_port_dialog.querySelector('#comm_port_select_ok').addEventListener('click', function() {
    serialPort = new SerialPort("COM1", {
      baudrate: 9600
    });
    comm_port_dialog.close();
  });


  //
  //Test error Notification
  //
  $("#error_test").click(function(){
    notification('alert', 'This is an error');
  });

});//end doc ready


//
//Notification toast
//
var timeoutID;  //Store the timeoutID globally so we can remove the timer before setting a new one.

function notification(type, message){
  //var data = {message: message};
  //document.querySelector('#notification_toast').MaterialSnackbar.showSnackbar(data);

  //clear the old timeout
  window.clearTimeout(timeoutID);
  //make a new one. Pretty much restarting the timer.
  timeoutID = window.setTimeout(function(){$(".notification").slideUp(250)},5000);

  if(type == "alert"){
    $(".notification").removeClass("info");
    $(".notification").addClass("alert");
  }else if(type == "info"){
    $(".notification").removeClass("alert");
    $(".notification").addClass("info");
  }

  $(".notification").html("<p>" + message + "</p>").slideDown(250);
}//end notification
