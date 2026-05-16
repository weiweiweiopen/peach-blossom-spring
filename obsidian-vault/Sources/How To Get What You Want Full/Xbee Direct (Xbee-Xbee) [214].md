---
source: How To Get What You Want / KOBAKANT DIY
title: "Xbee Direct (Xbee-Xbee)"
url: "https://www.kobakant.at/DIY/?p=214"
postId: 214
date: "2009-03-30T19:14:30"
modified: "2013-05-13T11:24:55"
slug: "xbee-direct-connection-xbee-xbee"
imported: "2026-05-16 10:16"
---

<!-- pbs-source:htgwyw -->
#pbs/source/htgwyw

# Xbee Direct (Xbee-Xbee)

Source: https://www.kobakant.at/DIY/?p=214

## Excerpt

Xbee can be connected directly like an invisible wire. You can set the matching pins as one of them as input (AI/DI) and the other as output (PO/DO).

## Content

Xbee can be connected directly like an invisible wire. You can set the matching pins as one of them as input (AI/DI) and the other as output (PO/DO).

You can see this application in  Wireless Tilt Sensing Bracelet,

 

To do this, you need to change some AT command. To access AT command, connect Xbee with computer with dongle, if you are using PC, you can use  X-CTU to program it. If you are using Mac, you can use  XBee Terminal Max by Rob Faludi, or make your own serial terminal communicator with your favorite program. Here is a small  max patch we use made by  Ingo Randolf. You can use it with  max/msp  runtime (free) if you do not have max license.

Here is an example AT command setup.

 [TABLE=5]

The example is based on the I/O Line Passing example on the Xbee series 1 manual p14. 

I/O lines are mapped in pairs. D0 input is connected to D0 output on the paired module. To enable the outputs to be updated, the IA (I/O Input Address) parameter must be setup with the address of the module. This effectively binds the outputs to a particular module’s input. The IU command enables I/O UART output. When enabled (IU = 1), received I/O line data packets are sent out the UART. 

Actually the communication can be bidirectional, meaning both side can have both input pin and output pin.

Here is an example setup. In this case, Xbee-A has D0 pin as input and D3 pin as output, and XBee-B has D0 pin as output and D3 pin as input. I first tried with D0 and D1 pin, but it did not work. It can be because the pins are too close (or maybe I had a bad connection on my breadboard…).

Anyway, here is the setup table. I hope this info helps your little tinkering..

And one important thing. The direct mode is only supported on Xbee series1. also, this this requires Firmware Version : v1.x80 (minimum). If you have very old Xbee series1, you need to do firmware update.

	XbeeA

ATID>>	1234

ATMY>>	5656

ATDL>>	7878

ATAI>>	0

ATIR>>	14

ATIT>>	5

ATBD>>	3

ATIU>>	1

ATIA>>	7878

ATD0>>	3

ATD1>>	0

ATD2>>	0

ATD3>>	4	

XbeeB

ATID>>	1234

ATMY>>	7878

ATDL>>	5656

ATAI>>	0

ATIR>>	14

ATIT>>	5

ATBD>>	3

ATIU>>	1

ATIA>>	5656

ATD0>>	4

ATD1>>	0

ATD2>>	0

ATD3>>	3
