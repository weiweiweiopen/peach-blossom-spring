---
source: How To Get What You Want / KOBAKANT DIY
title: "Openwear Finger Bend Sensor"
url: "https://www.kobakant.at/DIY/?p=4247"
postId: 4247
date: "2013-05-08T07:17:49"
modified: "2013-05-10T20:50:20"
slug: "openwear-finger-bend-sensor"
imported: "2026-05-16 10:16"
---

<!-- pbs-source:htgwyw -->
#pbs/source/htgwyw

# Openwear Finger Bend Sensor

Source: https://www.kobakant.at/DIY/?p=4247

## Excerpt

This project uses the Openwear open design for gLove Mono by Zoe Romano and integrates a felt & Velostat bend sensor on the middle finger. A LilyPad Arduino is programmed to read the analog sensor value of the fabric bend sensor, and trigger 1, 2 or 3 LED lights to light up depending on how […]

## Content

This project uses the Openwear open design for  gLove Mono by Zoe Romano and integrates a felt & Velostat bend sensor on the middle finger. A LilyPad Arduino is programmed to read the analog sensor value of the fabric bend sensor, and trigger 1, 2 or 3 LED lights to light up depending on how much the finger is bent. This example project was made for the codemotion workshop titled  Arduino meets Wearables.

Video:

Making-of:

Print, cut-out and trace pattern to felt:

Use knife to cut slits for elastic:

Measure length of elastic around your finger and sew together:

Add snaps to wrist band:

Sew analog input connection of bend sensor to bottom felt fabric:

Sew common GND (ground, negative, minus, -) connection starting with furthest away LED, then sew GND of sensor, then add last two LEDs:

And connect to GND pin of LilyPad. Tie knots at back:

Sew first LED light to digital pin 6, sew other two lights to pins 9 and 10:

Your top felt layer should look something like this:

When layed together your sensor should look something like this. Insert Velostat between contacts. Close sensor by stitching around edges:

Sew analog sensor pin connection to LilyPad pin A2:

Connect to computer via USB and FTDI board to program:

Here is the code >>  https://github.com/plusea/CODE/tree/master/WORKSHOP%20CODE/ARDUINOmeetsWEARABLES/fingerBendExample

Open code in Arduino and upload to board. Look at analog sensor values in serial monitor and adjust threshold values for triggering LEDs to come on and off.

1, 2 and 3:
