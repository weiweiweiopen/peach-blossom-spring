---
source: How To Get What You Want / KOBAKANT DIY
title: "Bela + Blanket"
url: "https://www.kobakant.at/DIY/?p=7575"
postId: 7575
date: "2019-03-26T11:41:29"
modified: "2019-04-02T13:19:20"
slug: "bela-blanket"
imported: "2026-05-16 10:16"
---

<!-- pbs-source:htgwyw -->
#pbs/source/htgwyw

# Bela + Blanket

Source: https://www.kobakant.at/DIY/?p=7575

## Excerpt

This is an example project/ experiment to use Bela board with e-Textile sensors. Here, I am making crochet blanket with exposed conductive pieces so one can use their skin resistance to “play” music by touching different part of the blanket. The blanket was originally made for a small workshop, and it was connected to Teensy […]

## Content

This is an example project/ experiment to use  Bela board with e-Textile sensors. Here, I am making crochet blanket with exposed conductive pieces so one can use their skin resistance to “play” music by touching different part of the blanket. The blanket was originally made for a small workshop, and it was connected to Teensy LC via breadboard and sending data to MaxMSP on a computer via USB serial. This time, I am extending this project to connect with Bela, which runs PD on board. The experiment is to find out good ways to connect textile sensors with Bela board. Also I wanted to play back the sound from wireless bluetooth speaker so the whole project can stay compact and mobile.

Bela Board is a combination of beaglebone (a mobile computer with Linux) with sound shield specialized on low latency sound synthesis. The mini bela board is small (size that fits on a palm) and has a good potential to be used with e-texitle/wearable projects. It can run with the USB powerbank (5V, micro USB).

  

In the mean time (the documentation about trying to connect to bluetooth speaker went to the bottom of this post) , I am looking at how the connection to the textile sensors an be made. Bela is not the cheapest equipment. It costs 60 Pounds. So, you may not always want to fix the board permanently on the project, but rather to take it out once the use of the project is finished. The strength of the Bela is that it is actually a computer that can run PD and other programing languages. It is a great prototyping/ experiment platform. 

My first attempt is to add small breadboard on Bela so one can easily experiment and change the circuitry as the prototype develops. There was a cut-up breadbaord in the studio already, so I cut them even smaller. The half of the standard breadboard width fits perfectly in the middle of Bela. 

  

Then you can use standard breadboard jumper cables and wires to create a temporal circuit connection on Bela. I am now concentrating on using resistive sensors with analog input pins. To read this kind of sensors, one needs to build  voltage divider circuits.

    

From the breadbaord to textile sensors, one needs some kind of bridging connection. Here, I am making knit cable with one side popper for textile connection, and the other side 2.54mm header pin for breadboard. 

   

The knit tube is made with a knitting mill. Then it is cut into length you need, close the tube with crochet hook, and insert conductive thread (in this case, I used Karlgrimm copper thread in double) using thick needle. 

    

Solder one end of the conductive thread onto each header pins. Then add hotglue on the connection so the strain of bending and pulling does not rely on this solder joint. 

     

After soldering and hot-gluing, connect the knit end with crochet hooks, add few more round of crochet until the header pin so the glue part is covered. 

 

Add popper in the other end. I wrapped around the conductive thread around the popper ring before pressing so that the thread touches the metal well. This knit cable will bridge the conductive knit on the blanket with the connections on the breadboard.

    

 

In the mean time, I made a lot of crochet patches with Statex silver thread. I used this one because this thread is soft and nice for crocheting, and I had a lot of it. Any conductive thread will work for this application. I used 2mm crochet hook and crochet with a combination of single and double crochet stitches.

  

Place the patches on the silver thread crochet line (the line is made wiht chain stitch + single/double crochet) that is already attached to the blanket. Then sew down the circle patches onto the blanket with normal cotton thread. Make sure to tightly sew the silver thread together so they electrically conduct well. The center end of the silver thread crochet line is punched with press snap so it connect with the knit cable I made before.

 BELA blanket from  mikst on  Vimeo.

The code on this example is PD patch, which is based on the example from Esteban’s residency workshop patch. It is simplified to just to trigger sound files with thresholds. The sound files also come from Esteban’s patch.

.flickr_badge_image {margin:0px;display:inline;}<br />.flickr_badge_image img {border: 0px solid #666666 !important; padding:0px; margin:2px;}<br />#flickr_badge_wrapper {width:600px;text-align:left}<br />

 more photos from the process >> 

Bluetooth Speaker + Bela

This sounds easy, as we are all surrounded by connected devices… but it is NOT. The beaglebone runs Linux system, and we need to find out how to connect to bluetooth speaker on this specific Linux system that is on the Bela.

I had a big help from  Ingo, and here is a tutorial we based our experiment >>  https://www.hackster.io/beaglefriends-octavosystems/pocketbeagle-alexa-0425b6

First, we connected wifi dongle on USB (we used USB hub so both the wifi dongle and bluetooth dongle can be connected to USB host port). The bluetooth dongle we used is “Speedlink SL 7411-BK”. Connecting to the wifi was more or less straight forward, except we needed to type-in the IP address manually. 

We followed the instruction on the tutorial Step4, and installed “python-alsaaudio sox espeak libcurl4-openssl-dev libsox-fmt-mp3”.

We were sure some of these things are probably not necessary… but did it anyway. And as we started to type in the command, we noticed some other things were missing, so we ended up installing bunch of things, like “pulseaudio-mobile” and “bluez”.

Then we did step 5.

Then the step 6 was a bit of a problem. First, “pulseaudio –start” does not work as in Beaglebone, you are logged in as root and you can not “–start” from root. so we used “pulseaudio –system”. Then secondly, you have to be in the group of “lp” in order to access pulseaudio (says  here). So we added ourselves to lp… still did not work and we ended up adding ourselves to bunch of groups (lp audio netdev bluetooth pulse pulse-access)… and it worked! well, at least now the pulseaudio is there now.

So we went on and the step 6.

scanning and paring the bluetooth seems fine… at least we were surprised that the bluetooth dongle was recognized without problem. but, when we go on to run “connect” command, it fails. It says “Failed to connect: org.bluez.Error.Failed” and the system log says “Bluetooth: “protocol not available””. We went further search on internet, there are some post about it, but not exactly.

Forum posts we read:

 https://bbs.archlinux.org/viewtopic.php?id=222083

 https://bbs.archlinux.org/viewtopic.php?id=188287

 https://bbs.archlinux.org/viewtopic.php?id=172163

Resources we used:

  https://wiki.archlinux.org/index.php/Bluetooth_headset#Pairing_works,_but_connecting_does_not 

 https://wiki.archlinux.org/index.php/bluetooth#Using_your_computer.27s_speakers_as_a_bluetooth_headset

We were getting error message like this “E: [pulseaudio] bluez5-util.c: GetManagedObjects() failed: org.freedesktop.DBus.Error.AccessDenied: Rejected send message, 2 matched rules; type=”method_call”, sender=”:1.1″ (uid=110 pid=757 comm=”pulseaudio –system “) interface=”org.freedesktop.DBus.ObjectManager” member=”GetManagedObjects” error name=”(unset)” requested_reply=”0″ destination=”org.bluez” (uid=0 pid=759 comm=”/usr/lib/bluetooth/bluetoothd “)” 

We changed the config file of dbus “/etc/dbus-1/system.d/bluetooth.conf” to give permission. The second low  to 

——-
 
    
  
——-

then type “service dbus restart”

Once again, run bluetoothctl and connect to the bluetooth… and it works! we hear the initial “kling!” sound.

exit the bluetooth, and now type in the command to play example sound for check. “aplay /usr/share/sounds/alsa/Front_Center.wav”

it works!

now, we are not sure why exactly the permission on the bluetooth config had to be changed as it gives permission to the group we are in… but well, for now it worked like this.

Well, this is not done yet. We could play sound from bluetooth speaker from the beaglebone, but not through Bela system. Now we need a help from Bela community to play sound via bluetooth from Bela.
