$(document).ready(function() {
  "use strict";

  //browser-serialport node module
  var SerialPort = require("browser-serialport");
  var serialPort;
  var comm_port_count = 0;
  var retry_attempts = 0;

  //filesystem node module
  var fs = require('fs');

  // Get the current window
  var win = nw.Window.get();
  // Show the dev tools at app startup
  win.showDevTools();

  //show the comm port connect button and hide the disconnect button.
  $("#dialog_comm_port_select").show();
  $("#comm_port_disconnect").hide();
  //hide the loading spinner
  $(".mdl-spinner").hide();


  //
  //Comm port selection
  //
  var comm_port_dialog = document.querySelector('#comm_port_select');
  document.querySelector('#dialog_comm_port_select').addEventListener('click', function() {
    //get the list of available comm ports if any
    SerialPort.list(function(err, ports) {
      if(ports.length > 0){
        if(comm_port_count != ports.length){
          //remove the old comm port radio buttons, the ports will change if something is plugged in or removed.
          $(".comm_radios").remove();

          //put a radio button for each available comm port
          ports.forEach(function(port, index) {
            console.log(port.comName);
            var p = document.createElement("p");
            p.className = "comm_radios";
            var label = document.createElement("label");
            label.className = "mdl-radio mdl-js-radio mdl-js-ripple-effect";
            label.setAttribute("for", "option-" + index);

            var input = document.createElement("input");
            input.setAttribute("type", "radio");
            input.setAttribute("id", "option-" + index);
            input.setAttribute("name", "options");
            input.setAttribute("value", port.comName);
            input.className = "mdl-radio__button";

            var span = document.createElement("span");
            span.className = "mdl-radio__label";
            span.appendChild(document.createTextNode(port.comName));

            //componentHandler.upgradeElement(label);

            $(label).append(input);
            $(label).append(span);
            $(p).append(label);
            //$(input).after(document.createTextNode(port.comName));
            $('#comm_port_select .mdl-dialog__content').prepend(p);

            //"<p>" +
            //  "<label class='mdl-radio mdl-js-radio mdl-js-ripple-effect' for='option-1'>" +
            //    "<input type='radio' id='option-1' class='mdl-radio__button' name='options' value='1' checked>" +
            //    "<span class='mdl-radio__label'>COM1</span>" +
            //  "</label>" +
            //"</p>"
            componentHandler.upgradeDom();
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
      changeRow(id, null, $("#modal_name").val());   //id, message, name
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
  var serial_retry;
  function serialConnect(port, baudrate){
    serialPort = new SerialPort.SerialPort(port, { baudrate: baudrate });
    var message_buffer = '';
    //this could be a reconnect attempt, so remove the old timer so a new one can be made.
    clearInterval(serial_retry);

    serialPort.on("open", function(){
      console.log("connection open");
      //hide the comm port connect button after successfull connect. Wait to show the disconnect button until after message received.
      $("#dialog_comm_port_select").hide();
      //show the spinner
      $(".mdl-spinner").show();

      //set a timer. If nothing is received after 3 seconds, reconnect.
      serial_retry = setInterval(function(){
        //if 3 attempts have been made but no connection, stop trying to connect.
        if(retry_attempts >= 3){
          retry_attempts = 0;
          //cancel the retry attempts.
          clearInterval(serial_retry);
          //display an error.
          notification('alert', 'Unable to connect to comm port');
          //show the comm dialog with the error in it.
          comm_port_dialog.showModal();
          //hide the spinner and show the connect button.
          $(".mdl-spinner").hide();
          $("#dialog_comm_port_select").show();
          //disconnect from the port and destroy the serialPort.
          serialPort.close();
          serialPort = null;
        }else{
          retry_attempts++;
          console.log("retrying connection");
          serialPort.close();
          serialPort = null;
          serialConnect($("input[name='options']:checked").val(), $("#comm_baud").val());
        }
      }, 3000);

      serialPort.on("error", function(error){
        notification('alert', error.message);
      });

      serialPort.on("data", function(data){
        //if data is received, remove the timer.
        clearInterval(serial_retry);
        //hide the spinner and show the disconnect button.
        $(".mdl-spinner").hide();
        $("#comm_port_disconnect").show();
        //push data into buffer so we can keep it around while playing with it.
        message_buffer += data.toString();

        console.log(message_buffer);
        if(message_buffer.indexOf('>') == message_buffer.length -1){
          //test against the regex pattern to make sure we have a complete messsage.
          if(/<\d{1,4},\d{1,3},\d{1,3},\d{1,3},\d{1,3},\d{1,3},\d{1,3},\d{1,3},\d{1,3}>/.test(message_buffer)){
            var temp_buff = message_buffer.replace('<','').replace('>','').split(',');
            //message_buffer = '';

            //convert string id to string hex id
            var temp_can_id = decimalStringToHexString(temp_buff[0]);
            temp_buff.splice(0,1);
            //var temp_message = temp_buff.join();
            changeRow(temp_can_id, temp_buff);
          }
          message_buffer = '';
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
      console.log("connection closed");
      //show the comm port connect button after disconnect and show the connect button.
      $("#dialog_comm_port_select").show();
      $("#comm_port_disconnect").hide();
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
function changeRow(id, message, name) {
  //console.log(name);
  //see if any rows have the same can id
  if($("tr[id*="+id+"]").length == 0){  //if it isn't found...
    //get the name from localStorage
    var saved_name = localStorage.getItem(id);

    //create a new tr with the message info
    $("tbody").append(
      "<tr id="+id+">" +
        "<td class='mdl-data-table__cell--non-numeric' id='"+id+"_id'>"+id+"</td>" +
        "<td class='mdl-data-table__cell--non-numeric' id='"+id+"_message'>"+
          "<div id='byte0' class='bytes'>"+message[0]+",</div>"+
          "<div id='byte1' class='bytes'>"+message[1]+",</div>"+
          "<div id='byte2' class='bytes'>"+message[2]+",</div>"+
          "<div id='byte3' class='bytes'>"+message[3]+",</div>"+
          "<div id='byte4' class='bytes'>"+message[4]+",</div>"+
          "<div id='byte5' class='bytes'>"+message[5]+",</div>"+
          "<div id='byte6' class='bytes'>"+message[6]+",</div>"+
          "<div id='byte7' class='bytes'>"+message[7]+"</div>"+
        "</td>" +
        "<td class='mdl-data-table__cell--non-numeric' id='"+id+"_name'>"+(saved_name != null ? saved_name : '')+"</td>" +
        "<td class='mdl-data-table__cell--non-numeric' id='"+id+"_count'>1</td>" +
      "</tr>"
    );
  }else{  //if there is a row with this id already...
    //if there is a message, update the table bytes with the new numbers.
    if(message){
      for(var i = 0; i <= 7; i++){
        //first, get the old byte from the table.
        var temp_byte = $("#"+id+" #"+id+"_message #byte"+i+"").text().replace(',','');
        //compare the old and new value and bold if changed
        if(temp_byte != message[i]){
          $("#"+id+" #"+id+"_message #byte"+i+"").text(message[i]+(i == 7 ? "" : ",")).css("font-weight","Bold");
          sessionStorage.setItem(id+"_"+i, 1);
        }else{
          //get byte change count from sessionStorage.
          var byteChageCount = sessionStorage.getItem(id+"_"+i);
          if(byteChageCount){ //if it exists...
            if(byteChageCount >= 3){  //if it equals 3 remove the bold, else keep it.
              $("#"+id+" #"+id+"_message #byte"+i+"").text(message[i]+(i == 7 ? "" : ",")).css("font-weight","Normal");
            }else {
              $("#"+id+" #"+id+"_message #byte"+i+"").text(message[i]+(i == 7 ? "" : ","));
            }
            sessionStorage.setItem(id+"_"+i, ++byteChageCount);
          }else {
            sessionStorage.setItem(id+"_"+i, 1);
          }
        }
      }
      //get the old count from the table, increment it, and stick it back into the table.
      $("#"+id+"_count").text(parseInt($("#"+id+"_count").text()) + 1);
    }
    //update the name if given.
    if(name){
      //save the new name in localStorage for future use.
      localStorage.setItem(id, name);
      $("#"+id+"_name").text(name);
    }
  }//end else

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


//
//Function to convert int to hex string.
//borrowed from http://stackoverflow.com/questions/57803/how-to-convert-decimal-to-hex-in-javascript from Tod
//
function decimalStringToHexString(number){
  number = parseInt(number);
  if(number < 0){
  	number = 0xFFFFFFFF + number + 1;
  }
  return number.toString(16).toUpperCase();
};//end decimalToHexString
