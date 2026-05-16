---
source: How To Get What You Want / KOBAKANT DIY
title: "EL panel/wire inverter hack"
url: "https://www.kobakant.at/DIY/?p=4101"
postId: 4101
date: "2013-03-07T16:46:22"
modified: "2014-08-12T10:46:36"
slug: "el-panelwire-inverter-hack"
imported: "2026-05-16 10:16"
---

<!-- pbs-source:htgwyw -->
#pbs/source/htgwyw

# EL panel/wire inverter hack

Source: https://www.kobakant.at/DIY/?p=4101

## Excerpt

EL panel and inverters are interesting material, but rather hard to control since it involves inverters with AC current. There are some nice tutorials on how to control AC side with triac or EL sequencer at sparkfun, buildr.. so on. But I always had a bit of problem when I want to fade them slowly, […]

## Content

EL panel and inverters are interesting material, but rather hard to control since it involves inverters with AC current.

There are some nice tutorials on how to control AC side with triac or  EL sequencer at sparkfun,  buildr.. so on. But I always had a bit of problem when I want to fade them slowly, or when I use many EL panels on at the same time.

(inverter that connects to EL sequencer has limitation on the size and number of EL panels it can light up at the same time)

Here, I hacked a small battery powered EL inverter to control DC side to control the lighting sequence of an EL panel.

I bought a small AA battery operable inverter for EL wires and panels  from sparkfun. The picture on the left shows the inside of this devise.

 

The circuit seems quite simple. I took off the transistor (IS8550) on the original circuit, extended it to the breadboard and added another transistor (mosFET) to control the power going through the transistor. I chose IRLML2502 mosFET since it has very little internal resistance. I’ve also tested with more common transistor (like BC546) but it was getting a bit hot and the EL panel did not get bright enough, so I changed to IRLML2502.

And here is the schematic of the same connection

And here is how the whole mess looks like

In this case, I have extra resistor between Arduino outpin and gate of the mosFET. I’m not sure if you need this one, so I removed it on the schematic. IRLML2502 comes with SMD package, so I soldered it onto 6 leg DIP socket. It is a bit of an extra work..

Here is the movie of it. It flickers a bit when it is in lower intensity. If you add a big capacitor, it should help to reduce it. The program on the Arduino is the same as the Arduino example Fade, except instead of swinging between 0-255, it is swinging between 100-255. You can control the intensity of the EL panel with analogWrite just like LED now.

Well, all this effort was because I wanted to hack and control bigger EL panel. There are many companies selling various sizes and colors of EL panel. The sizes can go up to A0. I wanted to use it in mobile context, so it needed to run with batteries. The largest EL panel I could find that can operate with batteries was A3 size. The picture shows the inverter that came for the A3 EL panel. It runs with 12v DC (8 AA batteries, or two 9V batteries and regulate it down to 12V)

The inside of the inverter looks like this

I used similar approach to the small EL inverter hack. control the DC current going into the whole inverter system. Here is the circuit I added to the inverter.

 

 

I wanted to control 7 of the A3 EL panels, which all fade in the same timing. So, I made 6 times of the same hack on 7 inverter boxes, and connected the control lines (it says Arduino outpin in the schematic) to Arduino mini pro PWM pins (All of the lines can be connected to same pin even).

And here is the result!
