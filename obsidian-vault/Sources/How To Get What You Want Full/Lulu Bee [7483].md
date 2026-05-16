---
source: How To Get What You Want / KOBAKANT DIY
title: "Lulu Bee"
url: "https://www.kobakant.at/DIY/?p=7483"
postId: 7483
date: "2019-01-12T15:38:44"
modified: "2022-03-16T19:42:14"
slug: "lulu-bee"
imported: "2026-05-16 10:16"
---

<!-- pbs-source:htgwyw -->
#pbs/source/htgwyw

# Lulu Bee

Source: https://www.kobakant.at/DIY/?p=7483

## Excerpt

Lulu is a hardware solution that interfaces between an LED light source, an optic fiber strand or bundle, and sewable soft circuit connections. The Lulu provides a toolset for using side glow optical fibers in your eTextile and wearable projects. Use of light in textile and fashion design is becoming more and more common as […]

## Content

Lulu is a hardware solution that interfaces between an LED light source, an optic fiber strand or bundle, and sewable soft circuit connections. 

The Lulu provides a toolset for using side glow optical fibers in your eTextile and wearable projects. Use of light in textile and fashion design is becoming more and more common as many of us look to embedded light in textiles as embroidery, in weaving, knitting and knotting process.

Versions:

Lulu Daisy Bumblebee_18.01 (black soldermask)

Lulu Daisy Bee V2 (white soldermask)

Lulu Bee Datasheet >>  https://www.flickr.com/photos/plusea/48622437482/sizes/l

LINKS:

Github >>  https://github.com/eTextile/Lulu

Documentation >>  http://www.kobakant.at/KOBA/category/lulu/

Photos >>  https://www.flickr.com/photos/plusea/sets/72157691569545895

WS2812B-MINI datasheet >>  http://www.normandled.com/upload/201607/WS2812B%20Mini%203535%20LED%20Datasheet.pdf

* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *

* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *

* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *

!!!!!!!!ATTENTION!!!!!!!!SOLDER TEMPERATURE!!!!!!!!

The WS2812B-MINI addressable LEDs can only withstand low soldering temperatures (max 250°C!) so you will need a soldering iron that you can set the temperature of.

> > > > > > > Solder at max 250°C!!! < < < < < < <

* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *

* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *

* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *

!!!!!!!!ATTENTION!!!!!!!!LED VOLTAGE!!!!!!!!

Even though the datasheet of the WS2812 states operating voltage as: +3.5~+5.3V, the LEDs we’ve received don’t run off a 5V power supply, but do run off 3.3V.

Until we solve this mystery we recommend: DON’T POWER YOUR Lulu FROM 5V.

> > > > > > > USE 3.3V to power your Lulu Bee!!! < < < < < < <

* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *

* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *

* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 

Pin-out

Datasheet

 

Assembly Instructions

SOLDERING THE LED

The WS2812B-MINI addressable LEDs can only withstand low soldering temperatures (max 250°C!) so you will need a soldering iron that you can set the temperature of. If you use leaded solder you can solder at even lower temperatures (215°C).

Prepare your working space by taping a piece of double sided tape or taping down a piece of tape with the sticky side up.

Stick the LED face down on the tape and apply solder to the VCC(+) pin.

Stick the Lulu Bee down and apply solder to the VCC(+) pad.

Leave the LED in place and pick up the Lulu Bee and hold it down on top of the LED so that the VCC connections line up. Use the soldering iron to re-heat the applied solder and make the connection between the LED pin and the PCB pad.

Now that the LED is held in place by the first solder joint you can solder the remaining connections. To do this, carefully lift the Lulu+LED off the tape and lie it down on it’s side to solder the remaining connections.

VIDEO:

SOLDERING THE CAPACITOR

This is optional. The capacitor helps avoid the risk of a peak in power damaging the chip or the LEDs inside the WS2812. When using many Lulu Bees in a chain, the capacitor can help store power to provide power when needed – for example when turning all LEDs white or blue (high power consumption colours).

Similar to above you can use the tape to hold things in place.

Apply solder to one lead of the capacitor and to one pad of the Lulu Bee.

Use fine-nose tweezers to hold the capacitor in place while re-heating the applied solder to make the connection. Once the capacitor is held in place by the first solder joint you can now solder the second connection.

VIDEO:

SHRINK-TUBE OPTIC-FIBER

Before sewing the circuit connections, shrink-tube the Lulu to the end of your optic-fiber. You can then twist the optic fiber to remove it and then you can re-insert it later.

SEWING THE LULU

Use a highly conductive thread to sew your power and data connections. We recommend the copper and silver threads from Karl-Grimm.

Sew neatly and tightly, to create good connections between your conductive thread and the pads of the PCB. Look at the images bellow for visuals of how this can look.

How to chain multiple Lulus

From the Dout pin sew to the Din pin of the next Lulu in your chain. The power (VCC+) and ground (GND-) connections can be sewn with a continuous thread, whereas the data connections need to be interrupted! Meaning you have to end the conductive thread at the Din pad and start with a new thread from the Dout…. and so on…..

Code Examples

There are two nice Neopixel (WS2812) libraries for Arduino and you can install both via the Arduino library manager:

Adafruit’s Neopixel library >>  https://learn.adafruit.com/adafruit-neopixel-uberguide/arduino-library-installation

FastLED library >>  http://fastled.io/

Sample Swatches

Single Lulu:

Two Lulus:

Bill of Materials (BOM)

– 3mm thick PCB manufactured by Elecrow:

>>  https://www.elecrow.com/pcb-manufacturing.html

KiCAD and Gerber files >>  https://github.com/eTextile/Lulu/tree/Lulu-daisy/Hardware/kicad_Lulu_daisy/Lulu_daisy_bumblebee_18.01

– WS2812B MINI Neopixel addressable RGB LEDs

datasheet >>  http://www.normandled.com/upload/201607/WS2812B%20Mini%203535%20LED%20Datasheet.pdf

>>  https://www.led-stuebchen.de/de/smd-leds/10x-ws2812b-5050-rgb-led-integriertem-ws2811-led-treiber-ic6

>>  https://www.ebay.de/itm/WS2812B-MINI-3535-RGB-LED-mit-integri

ertem-WS2811-LED-Treiber-IC/173140850411?hash=item284fffb6eb:m:m4evCf5P4NKZRo7GbEJvUgA

– 1uF 0603 capacitor mounted between VCC and GND (optional)

>>  http://www.segor.de/#Q=1u0-0603-X5R%252F25V&M=1

– 2mm diameter sideglow optic-fiber

>>  https://www.leds-and-more.de/catalog/20mm-lwl-lichtwellenleiter-lichtleiter-seitlich-leuchtend-p-1940.html?osCsid=2me5dl4q5amcvgb6tnbqfd87i5

– end-glow optic-fiber + ABRAISON!

 http://wiki.datapaulette.org/doku.php/atelier/documentation/materiautheque/materiaux/electronique_textile/actionneurs_textiles/fibres_optiques#la_connectique

0.25mm diameter/12000m/roll PMMA fiber optic cable end glow for decoration lighting

>>  https://www.aliexpress.com/item/0-25mm-diameter-12000m-roll-PMMA-fiber-optic-cable-end-glow-for-decoration-lighting/1923995977.html?spm=a2g0w.10010108.1000001.8.563c2ee3wVFURz

– 3.2mm diameter shrink-tube with hot-melt adhesive

– Karl-Grimm copper or silver plated copper conductive thread

>>  http://karl-grimm.de/

PCB Manufacturing

If you want to order your own batch of Lulus from a PCB manufacturer, get in touch with us for our latest Gerber files:  lulu@etextile.org

Ordered from Elecrow:

>>  http://elecrow.com/

Gerbers:

V1 >>  https://github.com/eTextile/Lulu/tree/Lulu-daisy

V2 >>

ORDER DETAILS:

– copper layers: 2

– PCB thickness: 3mm

– solder mask: matte black (on both sides)

– silkscreen: none

– surface finish: HASL lead free

– Castellated Hole：No

– Copper Weight：1oz

– PCB Stencil：NO

Early Sketches
