---
source: How To Get What You Want / KOBAKANT DIY
title: "Wireless JoySlippers"
url: "https://www.kobakant.at/DIY/?p=565"
postId: 565
date: "2009-06-05T20:41:33"
modified: "2009-06-28T11:20:24"
slug: "wireless-joyslippers"
imported: "2026-05-16 10:16"
---

<!-- pbs-source:htgwyw -->
#pbs/source/htgwyw

# Wireless JoySlippers

Source: https://www.kobakant.at/DIY/?p=565

## Excerpt

This is the wireless version of the origianally wired JoySlippers. Using Xbee Direct (Multipul Xbee – Xbee- comp) communication connection, rather than spiral telephone cable.

## Content

This is the wireless version of the origianally  wired JoySlippers. Using  Xbee Direct (Multipul Xbee – Xbee- comp) communication connection, rather than spiral telephone cable.

In this updated version the Velostat in the pressure sensors has been replaced with a piece of resistive EeonTex stretchy fabric. This makes the sensors much more durable and the resistance range is just as good, if not better, than that of the pressure sensors using Velostat.

Old vs. New >>

>>  www.joyslippers.plusea.at

>>  Wired JoySlipper Version 2 Instructable

>>  Wired JoySlipper Version 1 Instructable

Wireless Communication

For wireless communication, we used Xbee, connecting directly to sensor inputs. (without using microcontroller). This way, the wireless component can be much smaller and less power consuming.

Currently connections are made with thin cable directly soldered onto pin socket without purfboard. All the components are placed inside a small neoprene pouch that can be attached to JoySlippers with poppers. These poppers works as a connector to sensors as well.

 

Here is the connection plan between Li-Po Battery/Xbee/JoySlipper. For more detail about Li-Po battery, see  this post.

Each Slipper contains one Xbee and one Li-po battery. There is one receiver Xbee connected to computer via  USB dongle.

These Xbees are programed so that their analog inputs are enabled and send these data directly to receiver Xbee. Here is how the AT command is setup on each Xbee.

[TABLE=8]

For detail, please see  XBEE DIRECT (MULTIPUL XBEE – XBEE- COMP) post.
