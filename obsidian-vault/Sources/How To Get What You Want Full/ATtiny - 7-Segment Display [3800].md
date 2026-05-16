---
source: How To Get What You Want / KOBAKANT DIY
title: "ATtiny: 7-Segment Display"
url: "https://www.kobakant.at/DIY/?p=3800"
postId: 3800
date: "2012-11-20T14:01:51"
modified: "2013-06-23T09:23:26"
slug: "attiny-7-segment-counter"
imported: "2026-05-16 10:16"
---

<!-- pbs-source:htgwyw -->
#pbs/source/htgwyw

# ATtiny: 7-Segment Display

Source: https://www.kobakant.at/DIY/?p=3800

## Excerpt

This circuit uses the ATtiny 8-pin microcontroller which has 5 I/O pins to create a 7-segment display. Since a 7-segment display only requires control of 7 individual LEDs, we use 4 of the ATtiny I/O pins as charlieplexed outputs (n*(n-1)). Leaving the the fifth I/O pin to be used as digital or analog input or […]

## Content

This circuit uses the ATtiny 8-pin microcontroller which has 5 I/O pins to create a 7-segment display. Since a 7-segment display only requires control of 7 individual LEDs, we use 4 of the ATtiny I/O pins as  charlieplexed outputs (n*(n-1)). Leaving the the fifth I/O pin to be used as digital or analog input or another output.

Video

For some reason it is not working properly yet…

Photos

Front and back (LEDs mounted facing down):

ATtiny:

Full circuit:

Blurred lights:

Materials:

– ATtiny45 or 85 >>

– SMD LEDs >> 

Code:

>>  https://github.com/plusea/CODE/blob/master/EXAMPLE%20CODE/a_tiny7Segment/a_tiny7Segment.ino

Circuit:
