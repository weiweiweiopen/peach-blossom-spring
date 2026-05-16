---
source: How To Get What You Want / KOBAKANT DIY
title: "Xbee Direct (Multiple Xbee – Xbee- comp)"
url: "https://www.kobakant.at/DIY/?p=270"
postId: 270
date: "2009-04-07T11:21:29"
modified: "2009-07-02T10:21:19"
slug: "xbee-direct-multipoint-xbee-xbee-comp"
imported: "2026-05-16 10:16"
---

<!-- pbs-source:htgwyw -->
#pbs/source/htgwyw

# Xbee Direct (Multiple Xbee – Xbee- comp)

Source: https://www.kobakant.at/DIY/?p=270

## Excerpt

This post explores how to establish a communication between multiple Xbee that are connected with sensors to one receiving Xbee that is connected with computer. Xbee 802.15.4 with chip antenna is used in this example. For reading the Xbee input, I am using XBee API Library for Processing from Rob Faludi and Dan Shiftman This example is applied to WIRELESS JOYSLIPPERS. For detail […]

## Content

This post explores how to establish a communication between multiple Xbee that are connected with sensors to one receiving Xbee that is connected with computer. Xbee 802.15.4 with chip antenna is used in this example.

For reading the Xbee input, I am using  XBee API Library for Processing from  Rob Faludi and  Dan Shiftman

This example is applied to  WIRELESS JOYSLIPPERS. For detail of the physical construction, please see the Wireless Joyslippers post.

 

This example involves two Xbees sending sensor (pressure sensor) inputs to one Xbee that is connected to a computer with USB dongle.

Here is how the AT command is setup for each Xbee.

[TABLE=8]

The Sender1 and Sender2 Xbee’s IR rate is different. This is because I experienced data colliding when the rate is set to same. With this current setup, the collusion problem is reduced, though, data is still a bit jumpy time to time and I need a better solution to avoid the data collusion. I will keep updated with coming improvements.

Here is how the sensor Xbees are set up on breadboard. It is same as  XBEE DIRECT (SENSOR-XBEE-COMP)

 

 

JOYSLIPPERS have two pressure sensors on each slipper. We are using one Xbee on each slipper to wirelessly send sensor data to a computer via receiver Xbee connected with USB dongle. 

Here is the  processing sketch for receiving 4 sensor data from JOYSLIPPER, that is a simple modification of XbeeApiExample.

insert video here
