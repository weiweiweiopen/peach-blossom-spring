---
source: How To Get What You Want / KOBAKANT DIY
title: "Xbee lilypad shield PCB"
url: "https://www.kobakant.at/DIY/?p=4779"
postId: 4779
date: "2013-11-08T17:13:48"
modified: "2014-08-15T09:38:49"
slug: "xbee-lilypad-shield-pcb"
imported: "2026-05-16 10:16"
---

<!-- pbs-source:htgwyw -->
#pbs/source/htgwyw

# Xbee lilypad shield PCB

Source: https://www.kobakant.at/DIY/?p=4779

## Excerpt

I have printed a Xbee shield for lilypad, so you can snap Xbee onto a Lilypad using the FTDI pins (the 6pin headers on Lilypad) without disturbing the on/off switch or the Lipo connector. The PCB is designed with Fritzing. Here is the fritzing file on github >> https://github.com/mikst/code/blob/master/Xbee/XbeePCB.fzz Here is a bit of image […]

## Content

I have printed a Xbee shield for lilypad, so you can snap Xbee onto a Lilypad using the FTDI pins (the 6pin headers on Lilypad) without disturbing the on/off switch or the Lipo connector.

The PCB is designed with  Fritzing. Here is the fritzing file on github >>  https://github.com/mikst/code/blob/master/Xbee/XbeePCB.fzz

Here is a bit of image from assembly. You will need few components (2mm header socket, SMD LED, SMD register 50 ohm, 2.54mm angle socket)

 

I’ve printed the above PCB with fritzing but, you could export necessary files and ask other PCB printer too. Also, I have made a mistake on placing the LED on the backside, which made a nice effect on reflected light… but if you are printing your own, perhaps you want to correct that.

 

It fits nicely onto a lilypad, just slide the socket on the backside to the FTDI pins.

    

One thing to look after though.. The new Lilypad simple that can charge Lipo battery through FTDI connection has one draw back. When the power is on Lipo mode (when the switch is on ON side), the FTDI header’s 3.3V is disconnected from the power. I had to add extra cable to connect this header pin back to “+” pad of the Lilypad. If you have a new Lilypad simple, you need to add this cable to use the shield.

Now, I was hoping that this shield will also work as a Xbee programmer, like this one >>  https://www.sparkfun.com/products/9819. Time to time, you need to change the Pan ID or baudrate to use the Xbee.. and also you need the receiver Xbee connected to your computer. And it works as a programmer by connecting through the FTDI 3.3V breakout. You just need to connect all the connections (Be careful, you need to twist the TX and RX connection. TX should connect to RX and RX should connect to TX) with jumper cables.

I usually use small max patch programmed by Ingo Randolf to program Xbee. Here is the max patch on github >>  https://github.com/mikst/code/tree/master/Xbee

Yes, I know a lot of people do not use max.. but perhaps you can use  max runtime to open the .mxf file. I’ve also build an application. If you are a mac user, probably can open it.
