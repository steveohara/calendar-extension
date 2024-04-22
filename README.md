# Chrome Extension for Calendar
There are some annoying deficiencies with Google Calendar that can't be fixed without
some effort in creating a new Google Calendar Extension e.g. hiding events where you are
Optional or, filtering on colour etc.

These sorts of things should be in the product but alas, not yet and I don't have the time to 
create a proper Calendar plugin so this is the next best thing. Filter out the events using some CSS hacks.

It's pretty simple, the extension has the option to hide the events on the screen that are
designated as being optional by scanning the DOM and making the screen elements `display:none`.

You can turn on the feature from either the icon on the toolbar or from a context menu.

The settings are persistent, and they are synced across browsers on different machines via your profile.

As and when I come up with anything cool and new, I'll add it, but it does the job for the time being.

## Install
I haven't got it packaged as a marketplace extension yet, so to use it, you need to
install it in Developer Mode.

To start, download this repo either by cloning it or simply unpacking the zip file into a local
folder on your Pc/Mac.

Inside Chrome, go to "Manage Extensions", turn on "Developer Mode" in the top right hand corner and load
the extension using "Load unpacked". Simply select the folder that you downloaded this
project into.

Any problems, use this site.
