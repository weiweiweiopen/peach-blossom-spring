---
source: How To Get What You Want / KOBAKANT DIY
title: "ATtiny Serial & Wireless Boards!"
url: "https://www.kobakant.at/DIY/?p=4445"
postId: 4445
date: "2013-08-11T13:54:46"
modified: "2017-03-16T18:09:26"
slug: "attiny-serial-wireless-boards"
imported: "2026-05-16 10:16"
---

<!-- pbs-source:htgwyw -->
#pbs/source/htgwyw

# ATtiny Serial & Wireless Boards!

Source: https://www.kobakant.at/DIY/?p=4445

## Excerpt

For projects with few i/o pins, using an ATtiny is a great alternative to Arduino boards. Using software serial allows you to send and receive data over the serial port via an FTDI board, and connecting to one of Sparkfun’s Bluetooth mate boards makes for a pretty streightforward wireless option. (You could also connect it […]

## Content

For projects with few i/o pins, using an ATtiny is a great alternative to Arduino boards. Using software serial allows you to send and receive data over the serial port via an FTDI board, and connecting to one of Sparkfun’s Bluetooth mate boards makes for a pretty streightforward wireless option. (You could also connect it to xBee.) The following ATtiny board design incorporates a 6-pin header that can be used both for programming (ISP) and serial communication (FTDI, Bluetooth).

ATtiny45/85 have 5 programmable i/o pins. Depending on your project, you might only need to send or receive data so you could only use one of these pins as either rx (receive) or tx (transmit) and have 4 i/o pins left to either read analog or digital input or write digital or PWM output. If you need to both send and receive data (rx, tx) then you still have 3 i/o pins left for in/output.

ATtiny44/84 have 11 programmable i/o pins!!! And 8 of them can read analog input! 

The following examples show various uses of ATtiny with software serial and a Bluetooth mate module to send or receive data wirelessly between the ATtiny and a Processing sketch.

Software Serial Code

Capacitive Ball Sensor

Uses: Tiny45, 4 digital input pins for capacitive sensing, 1 pin for sending capacitive serial data (tx).

Processing sketch reads in senor values and visualizes them as well as plays sound.

Arduino Code >>

Processing Code >>

Eagle board design >>

Videos

Demo of the flex ATtiny Board:

First prototype:

Resistive Ball Sensor

Uses: Tiny44, 6 analog input pins for resistive stretch sensor sensing, both rx and tx pins are connected, though only tx is used for sending snesor data.

Processing sketch visualizes sensor values and uses sensor values to manipulate sound.

Arduino Code >>

Processing Code >>

Eagle board design >>

Photos:

Videos

Spider Board

Similar to perforated strip-board circuit described bellow. This is an Eagle layout for a PCB that has not been made.

Arduino Code >>

Processing Code >>

Eagle board design >>

Perforated Strip-Board Circuit

Uses: Tiny45, 3 i/o pins, both rx and tx pins are connected. This board is soldered on perforated strip-board and the i/o connections are broken out to snaps on a fabric paw.

Depending on how the pins are configured a Processing sketch either visualizes sensor values or can trigger outputs.

Circuit design:

Photos:

Cat’s Paw Snap Extension

Making contact to the 3 i/o pins by sewing from the circuit board to snaps on a piece of fabric that are arranged in the shape of a cat paw. Two versions of this board, one with magnets (magnets on the paw want to stick together so it becomes a bit tedious to work with), and one with metal press snaps (poppers).

Photos:

First Prototype

Uses: ATtiny45 with 3 i/o pins and both rx and tx for software serial communication. Sewn with solderable conductive thread on fabric and components soldered on.

ISP Programming Adaptor
