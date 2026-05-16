---
source: How To Get What You Want / KOBAKANT DIY
title: "simple heat circuit"
url: "https://www.kobakant.at/DIY/?p=3920"
postId: 3920
date: "2012-12-14T09:10:24"
modified: "2012-12-14T09:15:02"
slug: "simple-heat-circuit"
imported: "2026-05-16 10:16"
---

<!-- pbs-source:htgwyw -->
#pbs/source/htgwyw

# simple heat circuit

Source: https://www.kobakant.at/DIY/?p=3920

## Excerpt

You can make a simpler heat controlling circuit using TIP122 transistor. The above image is the schematic. If you want to control a lot of heat lines, you can use shift register between Arduino and input pin of TIP122. This method is not good if you turn on/off the heat in high frequency. TIP122 will […]

## Content

You can make a simpler heat controlling circuit using TIP122 transistor.

The above image is the schematic. If you want to control a lot of heat lines, you can use shift register between Arduino and input pin of TIP122.

This method is not good if you turn on/off the heat in high frequency. TIP122 will heat up and eventually break if you do so. Also, TIP122 is for 1A max. So, if you are letting through a lot of current, it is better to use  this circuit instead.

The schematic says 3-9V for the heat power supply. This is just an example. If the current that goes through TIP122 does not exceed 1A, you can use bigger voltage (or smaller voltage)

The below image is the example of how to connect. Please note that the LED is just an indicator. If you do not need an indicator, please take it away.
