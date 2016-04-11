$(document).ready(function() {
  "use strict";

  //browser-serialport node module
  var SerialPort = require("browser-serialport").SerialPort;
  var serialPort;

  //filesystem node module
  var fs = require('fs');

  // Get the current window
  var win = nw.Window.get();
  // Show the dev tools at app startup
  win.showDevTools();


  $.getJSON("messages.json", function(data) {
    //get each item from the json data and enter it into session storage if it isn't already there
    data.forEach(function(datum){
      if(!sessionStorage.getItem(datum.id)) {
        sessionStorage.setItem(datum.id,
                               JSON.stringify({"id": datum.id,
                                               "message": datum.message,
                                               "change": "",
                                               "name": "",
                                               "count": ""}));
      }
    });

    refreshTable();
	});//end getJSON


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
  //message detail
  //
  var message_detail_dialog = document.querySelector('#message_detail_dialog');
  var message_id;
  $('tbody').on('click', 'tr', function() {
    //get the message id from the data-index attribute
    message_id = $(this).data('index');
    //retrieve the message from session storage
    var message = JSON.parse(sessionStorage.getItem(message_id))
    //update the modal title with the can id
    $("#modal_can_id").text(message.id);
    //update the name text field to show the name from session storage
    $("#modal_name").val(message.name);
    message_detail_dialog.showModal();
  });

  //message dialog clicked cancel
  message_detail_dialog.querySelector('#message_select_close').addEventListener('click', function() {
    //close the dialog
    message_detail_dialog.close();
    //clear the name text field
    $("#modal_name").val("");
  });

  //message dialog clicked OK
  message_detail_dialog.querySelector('#message_select_ok').addEventListener('click', function() {
    var entered_name = $("#modal_name").val();

    if(/[^\w ]+/.test(entered_name)){ //if contains special characters...
      notification('alert', 'Name can not contain special characters');
    }else if(/.{41,}/.test(entered_name)){
      notification('alert', 'Name can not exceed 40 characters');
    }else{
      //get message from session storage and un-stringify it
      var message = JSON.parse(sessionStorage.getItem(message_id));
      //remove the old message from session storage
      sessionStorage.removeItem(message_id);
      //update the name to the user entered name
      message.name = $("#modal_name").val();
      //put updated message back into session storage
      sessionStorage.setItem(message.id, JSON.stringify(message));
      //close the dialog
      message_detail_dialog.close();
      //clear the name text field
      $("#modal_name").val("");
      //change the items in the row
      $("#"+message_id+"_name").text(message.name);
    }


    //refreshTable();
  });


  //
  //Open save file dialog when save icon is clicked.
  //
  $("#save_as_csv").click(function(){
    var chooser = $('#saveFileDialog');
    chooser.unbind('change');
    chooser.change(function(evt) {
      fs.writeFile($(this).val(), assemble_csv(), function(err) {
        if(err){
          notification('alert', 'Unable to save CSV');
          return console.log(err);
        }
      });
    });
    chooser.trigger('click');
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


//
//message detail
//
var message_detail_dialog = document.querySelector('#message_detail_dialog');
function message_dialog(id) {
  // Grab the template script
  var messageTemplate = $("#message-detail-template").html();
  // Compile the template
  var theTemplate = Handlebars.compile(messageTemplate);
  // Define our data object
  var message = JSON.parse(sessionStorage.getItem(id));
  // Pass our data to the template
  var theCompiledHtml = theTemplate(message);
  // Add the compiled html to the page
  $('#message_dialog_content').html(theCompiledHtml);
  message_detail_dialog.showModal();
};


//
//refresh the table based off the data in session storage
//
function refreshTable() {
  //get the messages from session storage and put them in the table
  var messages = [];
  for(var i = 0; i < sessionStorage.length; i++) {
    //get from sessionStorage, turm back into json, stick in array
    messages.push(JSON.parse(sessionStorage.getItem(sessionStorage.key(i))));
  }
  //get template from index
  var theTemplateScript = $("#message-template").html();
  //Compile the template​
  var theTemplate = Handlebars.compile(theTemplateScript);
  //stick data into template and place into index
  $('tbody').append(theTemplate(messages));
};


//
//create csv formatted string from the content of the table.
//borred from https://jsfiddle.net/terryyounghk/kpegu/
//
function assemble_csv() {
  // Temporary delimiter characters unlikely to be typed by keyboard
  // This is to avoid accidentally splitting the actual contents
  var tmpColDelim = String.fromCharCode(11), // vertical tab character
      tmpRowDelim = String.fromCharCode(0), // null character

      // actual delimiter characters for CSV format
      colDelim = '","',
      rowDelim = '"\r\n"',

  csv = '"' + $('table').find('tr').map(function (i, row) {
      var $row = $(row),
          $cols = $row.find('td,th');
      return $cols.map(function (j, col) {
          var $col = $(col),
              text = $col.text();
          return text.replace(/"/g, '""'); // escape double quotes
      }).get().join(tmpColDelim);
  }).get().join(tmpRowDelim).split(tmpRowDelim).join(rowDelim).split(tmpColDelim).join(colDelim) + '"'
  return csv;
};
