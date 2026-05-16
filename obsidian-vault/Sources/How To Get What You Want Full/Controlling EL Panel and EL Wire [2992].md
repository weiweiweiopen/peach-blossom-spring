---
source: How To Get What You Want / KOBAKANT DIY
title: "Controlling EL Panel and EL Wire"
url: "https://www.kobakant.at/DIY/?p=2992"
postId: 2992
date: "2011-04-28T18:22:30"
modified: "2012-11-20T12:03:15"
slug: "controlling-el-panel-and-el-wire"
imported: "2026-05-16 10:16"
---

<!-- pbs-source:htgwyw -->
#pbs/source/htgwyw

# Controlling EL Panel and EL Wire

Source: https://www.kobakant.at/DIY/?p=2992

## Excerpt

We have made some EL panel and EL wire controlling experiment. The first experiment is with EL sequencer from Sparkfun. The picture below shows how things are connected. EL sequencer has ATMega chip on it with Arduino bootloader. So, you can program it like arduino. (it is same as Lilypad 328 setup) To connect it […]

## Content

We have made some EL panel and EL wire controlling experiment.

The first experiment is with  EL sequencer from Sparkfun.

The picture below shows how things are connected. EL sequencer has ATMega chip on it with Arduino bootloader. So, you can program it like arduino. (it is same as Lilypad 328 setup) To connect it to the computer, I soldered cable to the board and connected to USB FTDI connector (something like  this)

There is one trick.. since we used built in inverter, we needed to connect GND to GND (see the picture below). I guess if you use individual inverter with power plug connected to EL sequencer, you do not need to do this…

We tried to fade in/out EL panel and EL wire.. this was a bit tricky…

Here is the arduino sketch we used  >>

We first tried with long EL wire, which ended up breaking one of the port.

It worked when we  connected short (about 50cm) wire.

When using panel, it looks much more flickerly..

With EL sequencer, it is not possible to light up different length wire together, or light up all 8 of them at the same time..

So, we tired to use our own Triac circuit.

We used  this Triac

and schematic is something like this..

With this way, “theoretically” you should be able to light up as many EL panels and wires as possible, as long as you have enough power supply for each of them. I have not tried it yet though..

Here is some videos.
