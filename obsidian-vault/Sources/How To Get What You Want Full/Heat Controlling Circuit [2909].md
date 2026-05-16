---
source: How To Get What You Want / KOBAKANT DIY
title: "Heat Controlling Circuit"
url: "https://www.kobakant.at/DIY/?p=2909"
postId: 2909
date: "2011-01-26T09:54:32"
modified: "2016-01-21T22:38:08"
slug: "heat-controlling-circuit"
imported: "2026-05-16 10:16"
---

<!-- pbs-source:htgwyw -->
#pbs/source/htgwyw

# Heat Controlling Circuit

Source: https://www.kobakant.at/DIY/?p=2909

## Excerpt

Here is the circuit schematics to control heating elements. I am using MOSFET as a digital switch to control on/off of the each heating element from Arduino digital out pins. The project I developed this circuit for uses multiple heating lines, therefor I am pulsing it with 100ms each. OpAmp and transistors are there to […]

## Content

Here is the circuit schematics to control heating elements.

I am using MOSFET as a digital switch to control on/off of the each heating element from Arduino digital out pins.

The project I developed this circuit for uses multiple heating lines, therefor I am pulsing it with 100ms each. OpAmp and transistors are there to open the MOSFET switch completely incase pulsing time was not enough.

!! oops, there was a mistake on the above schematic. I was powering the opAmp with too less power, and pushing the mosFET gate with 5V when it actually needs 12V to fully open the gate. The above schematic configuration will still work since IRLML0030’s internal resistance is very small, but when I replaced mosFET to other kind (STP16NF06), it started to heat up the mosFET since the gate is not fully opening. The revised schematic is following. I have tested this one, and it works with STP16NF06 too.

PDF download from here>> HeatControllDriver_Schematic.pdf

The original circuit schematic comes from Gabriel Wegscheider, who is my friend and a hard core engineer:) I am also posting his original schematic.

And here is some additional comment from Gabriel. “Some (oldstyle-)JFET-Opamps have Problems using input-voltage near GND and produce inaccurate output. So I shifted the low level of the positive input voltage to about 1/3 of supply-voltage instead of GND, thereon I shifted the reference-voltage from 1/2 to 2/3 of supply-voltage. After this correction this circuit should work with all opamps – not only rail-to-rail-opamps.”

So, if you are using old style OpAmps (I do not know which ones are “oldStyle” though…) you should change that part from this schematics.

He has also sent me a new version of FET controlling circuit schematics. In this one, TC4427 FET driver is used instead of opAmp and transistors. This way, you can spare out a lot of components.

The circuit is used to heat up steal based conductive thread which is woven in the cotton fabric. This fabric was developed at  Smart Textile Design Lab at  the Swedish school of textiles. Here is the first test movie from heating up the woven fabric which has thermochromic ink print on front surface.

 thermochromic heat pattern test from  mikst on  Vimeo.
