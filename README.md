# CAN see

##### CAN bus sniffer to be used with Seeed Studio CAN-BUS Shield.

Inspired by [Martin Viljoen's project](http://jeepjkcanbus.blogspot.com/2014/04/martins-can-bus-sniffer-tool-v10.html), CANsee is an updated tool which is able to display the CAN messages sent across your vehicles internal network. It is built using [NW.js](http://nwjs.io/) (formerly Node Webkit) in the hopes that it will be Mac, Linux, and Windows frienly all from one code-base.




##Things to do:

* Send messages.



##Things finished:

* When message with same id has been received, increment Message count column.

* Program Arduino to send messages formatted in the spec that CAN-BUS-TOOL uses so I can test this without having to connect to my car.

* Convert CAN id to hex because it looks nice.

* When successfully connected to a comm port, hide the connect button and show the disconnect button. When disconnected, hide the disconnect button and show the connect button.

* Move the errors for modals into the modals. ex: the more comm ports there are the taller the comm port connect modal will be. This will cover up the error if there are lots of comm ports regardless of how tall the app window is. It also just makes sense to have the error notification in the active space, not in the greyed out background.

* Make some sort of serial reconnect upon no data. For some reason I need to connect twice sometimes to get any data through. Perhaps if no data after a few seconds, reconnect.

* Show spinner between comm port modal OK and successful connect.

* Safely disconnect from serial on app close.

* Format message column content so table column widths don't change.

* When message has changed, highlight changed byte in Change column.
  Perhaps just embolden the changed byte in the message column.

* Save the names of the messages in localStorage.

* Fix disconnect on app close. win not defined.
  Removed safe disconnect. serialPort was no longer defined after close event fired. Perhaps browser-serialport does it's own closing on close event.

* Make radio buttons for comm port selection look nice.

* Fix comm port duplication when new comm port is selectable after app has started.

* Add fail to retry after 3 attempts.

* Removed handlebars lib.

* Check for errors in the incoming message stream. Don't display errored messages on the table.

* Fix names, you cant erase a name since it is sending in a null value.
