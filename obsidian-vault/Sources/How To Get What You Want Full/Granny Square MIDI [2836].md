---
source: How To Get What You Want / KOBAKANT DIY
title: "Granny Square MIDI"
url: "https://www.kobakant.at/DIY/?p=2836"
postId: 2836
date: "2010-09-24T20:14:05"
modified: "2010-09-25T12:48:55"
slug: "granny-square-midi"
imported: "2026-05-16 10:16"
---

<!-- pbs-source:htgwyw -->
#pbs/source/htgwyw

# Granny Square MIDI

Source: https://www.kobakant.at/DIY/?p=2836

## Excerpt

When conductive yarn is knit/crochet into small pieces, it shows pressure sensitive property. I made granny squares, which middle gray part is made with conductive yarn thus pressure sensitive. Nine of the granny squares are assembled together like the typical granny blankets, which is actually a pressure sensitive button array. The assembled granny squares are […]

## Content

When conductive yarn is knit/crochet into small pieces, it shows pressure sensitive property. I made  granny squares, which middle gray part is made with conductive yarn thus pressure sensitive. Nine of the granny squares are assembled together like the typical granny blankets, which is actually a pressure sensitive button array.

The assembled granny squares are connected to Arduino programed to interface with MIDI signal. Now the granny squares are MIDI interface.

The sound is not great.. (the window was open and you hear a lot of outside sound) but you can get an idea of how it works. For this test, I just connected with simple max patch to demonstrate the MIDI inputs, but it can be connected with more complicated patch or MIDI instrument directly just like other MIDI interfaces.

To make MIDI interface with Arduino, I followed this tutorial.

>> http://arduino.cc/en/Tutorial/Midi

>> http://itp.nyu.edu/physcomp/Labs/MIDIOutput

To interface with computer, I used USB MIDI converter. You can buy this in local electronics shops.

Here is the  Arduino sketch I used

Making:

First, make a lot of conductive Granny Squares. In this example I made nine of them.

Connect Granny Squares with normal yarn. I used one row of single crochet and next round with slip stitch.

 

I used thick felt for the backing layer. It can be also normal fabric. Before sewing the backing layer to the blanket, make sure to pull all the conductive yarn connection to front side. Mark the conductive traces’ placement with  fabric markers. Before cutting the conductive fabrics in stripes to make traces, I have fused the fusible interfacing on the back of the fabric. After placing the conductive traces, attache them to the backing felt by ironing on them.

 

This is how the finished circuit looks like. Make sure to cover the over wrapping traces with normal fabric.

 

Now connect to the Arduino. Here, for the quick test, I used crocodile clip, but it can be improved to knitted stretchy cable or fabric ribbon cable.
