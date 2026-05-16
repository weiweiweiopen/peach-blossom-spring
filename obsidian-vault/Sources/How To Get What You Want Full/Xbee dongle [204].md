---
source: How To Get What You Want / KOBAKANT DIY
title: "Xbee dongle"
url: "https://www.kobakant.at/DIY/?p=204"
postId: 204
date: "2009-03-30T18:52:56"
modified: "2009-07-02T11:19:11"
slug: "xbee-dongle-link"
imported: "2026-05-16 10:16"
---

<!-- pbs-source:htgwyw -->
#pbs/source/htgwyw

# Xbee dongle

Source: https://www.kobakant.at/DIY/?p=204

## Excerpt

To communicate with Xbee from your computer, you need to make serial or USB/serial connection between your computer and Xbee. There are some Xbee-USB dongles you can buy, such as XBee Explorer USB from Sparkfun or USB-XBEE-DONGLE-CARRIER from New Micros. Also, here is a nice site that shows how to make your own USB-Xbee dongle (I […]

## Content

To communicate with Xbee from your computer, you need to make serial or USB/serial connection between your computer and Xbee.

There are some Xbee-USB dongles you can buy, such as  XBee Explorer USB from Sparkfun or  USB-XBEE-DONGLE-CARRIER from New Micros.

Also, here is a nice site that shows  how to make your own USB-Xbee dongle (I think you still need to buy their PCB though) 

  

From Left: Sparkfun Xbee breakout board, 2mm-2.5mm pin connected with ribbon cable, USB dongle from New Micros, XBee Explorer USB from Sparkfun 

I usually use USB dongle from New Micros, but if I do not have one, or for some reason if I need quick and cheap solution, I use Arduino Diecimila. (Arduino Diecimila has 3.3v output already, so it makes it easier. You can use 3.3v regulator and use other kind of Arduino too.)

 

To use Arduino as USB dongle, take off the ATmega168 chip from the socket. This way nothing is communicating with TX RX port to your USB connection.

Now, connect your Xbee to breadboard. The tricky thing is that Xbee’s pins are 2mm header and normal breadboard or Arduino has 2.5mm spacing sockets. It simply does not fit! (This is quite disappointing when you finally decide to try out Xbee at night and notice that you can not even connect to a breadboard..)

So, unless you want to directly solder to the Xbee pins, you need 2 of 2mm 10pin sockets and 2.5mm 10pin headders to make a pin size converter. You can find various products which do this such as  Breakout Board for XBee Module,I usually use simple hand made converter, which is 2mm socket connected to 2.5mm socket connected with ribbon cable (see pic above).

After you get your Xbee connected to breadboard, make the Xbee pins connection to Arduino as following.

And it should look like this somehow…

Now you can connect the USB cable on from Arduino to your computer, and it should see it as USB-serial port. (do not forget to check if the power jumper on Arduino is on USB side)
