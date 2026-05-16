---
source: How To Get What You Want / KOBAKANT DIY
title: "ATTINY POV"
url: "https://www.kobakant.at/DIY/?p=4926"
postId: 4926
date: "2013-12-05T23:28:09"
modified: "2015-05-15T12:42:12"
slug: "attiny-pov"
imported: "2026-05-16 10:16"
---

<!-- pbs-source:htgwyw -->
#pbs/source/htgwyw

# ATTINY POV

Source: https://www.kobakant.at/DIY/?p=4926

## Excerpt

Inspired by this Instructable (http://www.instructables.com/id/LilyPad-Wrist-Band-POV/), I have tried to make a POV (Persistence Of Vision) with ATTINY, so it can be cheap and tiny. Materials used: – 8 SMD LED – ATTINY45 – 8 pin socket (not necessary) – KarlGrimm conductive thread – Lipo battery My idea is to use ATTINY45 (or 85) instead of […]

## Content

Inspired by this Instructable ( http://www.instructables.com/id/LilyPad-Wrist-Band-POV/), I have tried to make a POV (Persistence Of Vision) with ATTINY, so it can be cheap and tiny.

 

Materials used:

– 8 SMD LED

– ATTINY45

– 8 pin socket (not necessary)

– KarlGrimm conductive thread

– Lipo battery

My idea is to use ATTINY45 (or 85) instead of Lilypad to make a small and cheap version of it. As ATTINY has only 5 pins available for controlling LED, I used  charlieplexing to increase the number of LED I can control with 5 pins. This way I can have maximum 20 LEDs.

For the POV, 20 will be a bit too much. I decided to use 8 LEDs. Below is my very messy hand-drawn schematic.

Now it is all about sewing it up. I used KarlGrimm’s conductive thread. This thread is almost like wire, it has very low resistance so you do not have to worry about the length of the stitches, and you can solder on it.

After the stitches are in place, I soldered the SMD LED on the threads. It helps to use double sticky tape to drop the solder on the back of the SMD LED. After this, I added wire with JST socket to connect to lipo battery and battery pocket.

  

Then upload the POV sketch to ATTINY45 and place it on the socket.

The code is here >>  https://github.com/mikst/code/tree/master/attiny_POV

    

I made a eTextile swatchbook with this technique and laser cut copper fabric trace.

You can find the detail at the swatch book page >>  http://etextile-summercamp.org/swatch-exchange/attiny-pov/
