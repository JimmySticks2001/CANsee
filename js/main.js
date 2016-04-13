$(document).ready(function() {
  "use strict";

  //browser-serialport node module
  var SerialPort = require("browser-serialport");
  var serialPort;
  var comm_port_count = 0;

  //filesystem node module
  var fs = require('fs');

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
    SerialPort.list(function(err, ports) {
      if(ports.length > 0){
        if(comm_port_count != ports.length){
          //put a radio button for each available comm port
          ports.forEach(function(port, index) {
            console.log(port.comName);
            var p = document.createElement("p");
            //var label = document.createElement("label");
            //label.className = "mdl-radio mdl-js-radio mdl-js-ripple-effect";
            //componentHandler.upgradeElement(label);
            //label.setAttribute("for", "option-2");
            var input = document.createElement("input");
            input.setAttribute("type", "radio");
            input.setAttribute("id", "option-" + index);
            input.setAttribute("name", "options");
            input.setAttribute("value", port.comName);
            //input.after();
            //input.className("mdl-radio__button");
            //var span = document.createElement("span");
            //span.className("mdl-radio__label");

            //$(label).append(input);
            //$(label).append(span);
            $(p).append(input);
            $(input).after(document.createTextNode(port.comName));
            $('#comm_port_select .mdl-dialog__content').prepend(p);

            //"<p>" +
            //  "<label class='mdl-radio mdl-js-radio mdl-js-ripple-effect' for='option-1'>" +
            //    "<input type='radio' id='option-1' class='mdl-radio__button' name='options' value='1' checked>" +
            //    "<span class='mdl-radio__label'>COM1</span>" +
            //  "</label>" +
            //"</p>"
            comm_port_count = ports.length;
          });
        }//end if port count changed

        //display the comm port select dialog
        comm_port_dialog.showModal();
      }else{
        notification('alert', 'Unable to find any comm ports');
      }
    });
  });

  comm_port_dialog.querySelector('#comm_port_select_close').addEventListener('click', function() {
    comm_port_dialog.close();
  });

  comm_port_dialog.querySelector('#comm_port_select_ok').addEventListener('click', function() {
    serialConnect($("input[name='options']:checked").val(), $("#comm_baud").val());
    comm_port_dialog.close();
  });


  //
  //message detail
  //
  var message_detail_dialog = document.querySelector('#message_detail_dialog');
  var id;
  $('tbody').on('click', 'tr', function() {
    //get the message id from the tr id attribute
    id = this.id;
    //get the name from the table
    var name = $("#"+id+"_name").text();
    //update the modal title with the can id
    $("#modal_can_id").text(id);
    //update the name text field to show the name from the table
    $("#modal_name").val(name);
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
      //put updated name in the table
      changeRow(id, null, null, $("#modal_name").val());   //id, message, change, name
      //close the dialog
      message_detail_dialog.close();
      //clear the name text field
      $("#modal_name").val("");
    }
  });


  //
  //Open save file dialog when save icon is clicked.
  //
  $("#save_as_csv").click(function(){
    var chooser = $('#saveFileDialog');
    chooser.unbind('change');
    chooser.change(function(evt) {
      fs.writeFile($(this).val(), assembleCsv(), function(err) {
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
  //$("#error_test").click(function(){
  //  notification('alert', 'This is an error');
  //});


  //
  //Manage serial connection here.
  //
  function serialConnect(port, baudrate){
    serialPort = new SerialPort.SerialPort(port, { baudrate: baudrate });
    var message_buffer = '';

    serialPort.on("open", function(){
      console.log("connection open");

      serialPort.on("error", function(error){
        notification('alert', error.message);
      });

      serialPort.on("data", function(data){
        //push data into buffer so we can keep it around while playing with it.
        message_buffer += data.toString();

        if(message_buffer.indexOf('>') != -1){ //we should have a complete message if > is in the buffer.
          //console.log(message_buffer.toString());
          var temp_buff = message_buffer.replace('<','').replace('>','').split(',');
          message_buffer = '';

          console.log();
          var temp_can_id = temp_buff[0];
          temp_buff.splice(0,1);
          var temp_message = temp_buff.join();
          changeRow(temp_can_id, temp_message);
        }
      });

    });

    serialPort.on("error", function(error){
      notification('alert', error.message);
    });

    //
    //Disconnect from comm port when icon clicked
    //
    $("#comm_port_disconnect").click(function(){
      serialPort.close();
    });

  };//end serialConnect

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
};//end notification


//
//Add or edit a table row. Edits info on an existing row or adds it if it doesn't exist.
//
function changeRow(id, message, change, name) {
  //set optional params if not entered
  if(message == null){message = $("#"+id+"_message").text();}
  if(change == null){change = $("#"+id+"_change").text();}
  if(name == null){name = $("#"+id+"_name").text();}

  //see if any rows have the same can id
  if($("tr[id*="+id+"]").length == 0){  //if it isn't found...
    //create a new tr with the message info
    $("tbody").append(
      "<tr id="+id+">" +
        "<td class='mdl-data-table__cell--non-numeric' id='"+id+"_id'>"+id+"</td>" +
        "<td class='mdl-data-table__cell--non-numeric' id='"+id+"_message'>"+message+"</td>" +
        "<td class='mdl-data-table__cell--non-numeric' id='"+id+"_change'>"+change+"</td>" +
        "<td class='mdl-data-table__cell--non-numeric' id='"+id+"_name'>"+name+"</td>" +
        "<td class='mdl-data-table__cell--non-numeric' id='"+id+"_count'>1</td>" +
      "</tr>"
    );
  }else{  //if it is found, update the appropriate column with the new info.
    if(message != null){$("#"+id+"_message").text(message);}
    if(change != null){$("#"+id+"_change").text(change);}
    if(name != null){$("#"+id+"_name").text(name);}
    //get the old count from the table, increment it, and stick it back into the table.
    $("#"+id+"_count").text(parseInt($("#"+id+"_count").text()) + 1);
  }
};//end changeRow


//
//create csv formatted string from the content of the table.
//borrowed from https://jsfiddle.net/terryyounghk/kpegu/
//
function assembleCsv() {
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
};//end assembleCsv
