---
source: How To Get What You Want / KOBAKANT DIY
title: "Lulu optic fiber swatches"
url: "https://www.kobakant.at/DIY/?p=7536"
postId: 7536
date: "2019-02-25T14:17:54"
modified: "2019-02-25T14:22:15"
slug: "lulu-optic-fiber-swatches"
imported: "2026-05-16 10:16"
---

<!-- pbs-source:htgwyw -->
#pbs/source/htgwyw

# Lulu optic fiber swatches

Source: https://www.kobakant.at/DIY/?p=7536

## Excerpt

Swatches that showcase some of the things you can do with the Lulu Daisy – a design solution to connecting e-textiles, LEDs and optic-fibers. – 3 swatches – 6 mini crocodile clips – 1 breadboard with Teensy and crocodile clip connections for (+3V, GND, Data) demo code: cycles through one swatch at a time. was […]

## Content

Swatches that showcase some of the things you can do with the  Lulu Daisy – a design solution to connecting e-textiles, LEDs and optic-fibers.

– 3 swatches

– 6 mini crocodile clips

– 1 breadboard with Teensy and crocodile clip connections for (+3V, GND, Data)

 

demo code:

cycles through one swatch at a time. was done very quickly, could be improved….

>>  https://github.com/eTextile/Lulu/blob/master/Software/Arduino/Lulu_daisySwatch/Lulu_daisySwatch.ino

1)”hello world”

uses 1.5mm diameter sideglow optic fiber to write text.

code fades between “hello” and “world” revealing one at a time. without the light you can not read what it says.

 

 

 

2)”future fungus”

uses 2mm diameter sideglow optic fiber inserted into edging. the optic fiber functions both as illuminating material as well as rigid frame that causes the fabric to curve/curl in organic shapes.

code fades LED at either end of the optic-fiber to demonstrate colour-mixing.

 

 

 

3)”tilt data”

the data-pin of the LEDs is broken out to petals of conductive fabric. the data coming from the microcontroller flows into the central bead and only affects the LED whose petal it is resting on.

demos 1.5mm, 2mm and 3mm diameter sideglow optic fiber without the cladding, showing effects of cutting into the core to create illumination artefacts.

code fades between colours.

 

 

The board that controls it all:

 

IMPORTANT: 

– do not power the swatches with 5V!!! only power from the +3V of the Teensy!

– the crocodile clips between the swatches should be: top=+3V, middle=GND, bottom=Data

– mount the swatches in the following order: 1)”hello world”, 2)”future fungus”, 3)”tilt data”
