---
source: How To Get What You Want / KOBAKANT DIY
title: "ETextile CARD10"
url: "https://www.kobakant.at/DIY/?p=7747"
postId: 7747
date: "2019-08-24T08:39:43"
modified: "2019-08-26T07:05:36"
slug: "etextile-card10"
imported: "2026-05-16 10:16"
---

<!-- pbs-source:htgwyw -->
#pbs/source/htgwyw

# ETextile CARD10

Source: https://www.kobakant.at/DIY/?p=7747

## Excerpt

ccc camp 2019 Extend your CARD10 wristband out into the world….. of etextiles! friday, 22-8-19, 19:00-20:30 in the CARD10 village saturday, 23-8-19, 18:30-20:00 in the CARD10 village >> https://card10.badge.events.ccc.de/en/workshops/ bring (if you have): – your CARD10, USB-C cable, laptop – “normal” LEDs – scissors – pliers – sewing needles step-by-step: More photos: https://flickr.com/photos/plusea/albums/72157710505658161 STAGE 1: […]

## Content

ccc camp 2019

Extend your CARD10 wristband out into the world….. of etextiles!

friday, 22-8-19, 19:00-20:30 in the CARD10 village

saturday, 23-8-19, 18:30-20:00 in the CARD10 village

>>  https://card10.badge.events.ccc.de/en/workshops/

bring (if you have):

– your CARD10, USB-C cable, laptop

– “normal” LEDs

– scissors

– pliers

– sewing needles

step-by-step:

More photos:  https://flickr.com/photos/plusea/albums/72157710505658161

STAGE 1: e-textile hardware

STAGE 2: micropython software

STAGE 1: e-textile hardware

this example shows you how to sew a simple “normal” (not addressable) LED to a GPIO pin of your CARD10. 

!caution! turn off your CARD10 when working on it with conductive thread.

note: in this example we are skipping to use a current limiting resistor for the LED. this will probably result in a less-long-life of your LED but should not damage your CARD10!

there are 4 General Purpose In Out pins broken out to sewable vias (plated holes) along the edges of your CARD10 as well as 3.3V and GND.

GPIO1

GPIO2

GPIO3

GPIO4

3.3V

GND

Step1) decide

– decide where the led on your wristband should go.

Step2) curl LED legs

– curl the legs of your led to make them “sewable”.

– take note of which leg is + and which is -.

 

Step3) plan your circuit

– decide which GPIO pin you want to connect your LED to.

– if you connect the LED+ to the GPIO you need to connect the LED- to GND.

– if you connect the LED- to the GPIO you need to connect the LED+ to 3.3V.

in this example we will connect a red LED+ between GPIO1 and LED- to GND.

Step4) sewing

– cut a piece of conductive thread only as long as you need to make a connection. likely 20cm of thread will be enough!

– thread your needle-

– tie a knot in the far end of the thread.

– stitch into the neoprene about 1cm away from the GND hole* without sewing all the way through and the come out of the hole of the GND hole on the CARD10.

– sew around the via 3 times, each time pulling the thread thight

– sew back into the neoprene and come back out where the knot is sitting on the neoprene.

– continue sewing to the LED- lead of your LED.

– sew around the lead 3-4 times and then stitch away 1cm* and tie a knot close to the surface of the fabric.

– cut the rest of the conductive thread.

 

 

* note: the reason we tie the knots away from the vias and LED legs is so that you don’t have the end of the conductive thread close to the board where fraying thread can cause unwanted connections to neighboring pins

 

 

 

 

– cut the ends of the conductive thread really short.

– if you have: use nail varnish to coat the knots to keep them from coming undone.

 

 

Step5) repeat

– repeat step 4 to make a connection between the LED+ and GPIO1.

 

 

Step6) test

– before turning on your CARD10 test your connections with a multimeter.

check:

 – that LED+ is connected to GPIO1

 – that LED- is connected to GND

 – that there is no connection between GPIO1 and GND

STAGE 2: micropython software

Step1) firmware

make sure you have the latest firmware (EGPLANT or higher)

>>  https://card10.badge.events.ccc.de/en/firmwareupdate/

Step2) app

download and intall the etextile-tester app:

download >>  https://badge.team/projects/etextile_tester

intall >>  https://card10.badge.events.ccc.de/en/gettingstarted#usb-storage

in your “apps/” directory create a folder called “etextile-tester” and copy __init__.py there….

Step3) gpio code

edit the test code

GPIO documentation >>  https://firmware.card10.badge.events.ccc.de/pycardium/gpio.html

LED documentation >>  https://firmware.card10.badge.events.ccc.de/pycardium/leds.html

#cccamp19

#etextile

#wickedfabrics

#card10
