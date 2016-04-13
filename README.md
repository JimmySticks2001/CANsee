:D


Things to do:

When message has changed, highlight changed byte in Change column.
  Perhaps just embolden the changed byte in the message column.

Format message column content so table column widths don't change.

Check for errors in the incoming message stream. Don't display errored messages on the table.

When successfully connected to a comm port, hide the connect button and show the disconnect button. When disconnected, hide the disconnect button and show the connect button.

Move the errors for modals into the modals. ex: the more comm ports there are the taller the comm port connect modal will be. This will cover up the error if there are lots of comm ports regardless of how tall the app window is. It also just makes sense to have the error notification in the active space, not in the greyed out background.

Make some sort of serial reconnect upon no data. For some reason I need to connect twice sometimes to get any data through. Perhaps if no data after a few seconds, reconnect.
