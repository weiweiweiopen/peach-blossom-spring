---
source: How To Get What You Want / KOBAKANT DIY
title: "BLE (Bluetooth Low Energy)"
url: "https://www.kobakant.at/DIY/?p=4567"
postId: 4567
date: "2013-08-29T11:34:51"
modified: "2013-10-09T10:28:59"
slug: "ble-bluetooth-low-energy"
imported: "2026-05-16 10:16"
---

<!-- pbs-source:htgwyw -->
#pbs/source/htgwyw

# BLE (Bluetooth Low Energy)

Source: https://www.kobakant.at/DIY/?p=4567

## Excerpt

Bluetooth Low Energy (BLE) is the new Bluetooth 4.0 standard (not backwards compatible!) being used by many new devices such as the iPhone and iPad. BlueGiga’s BLE module allows you to make your own device talk to other BLE devices. To make it even easier to use the BlueGiga module there exist a BLE Breakout […]

## Content

Bluetooth Low Energy (BLE) is the new Bluetooth 4.0 standard (not backwards compatible!) being used by many new devices such as the iPhone and iPad.  BlueGiga’s BLE module allows you to make your own device talk to other BLE devices. To make it even easier to use the BlueGiga module there exist a  BLE Breakout Board by Jeff Rowberg (who works for BlueGiga) and  Michael Kroll’s Arduino BLE Sheild, as well as a  Mini BLE Shield from RedbearLab which I have not tried yet.

This post is basically a collection of various information related to using both these shields to enable an Arduino to send and receive Serial data to an iPhone.

Bluegiga BLE module mounted on different boards:

BLE Breakout Board by Jeff Rowberg

Caution: The BLE Board runs on 3.3V! Connecting it to a 5V power supply will damage the chip!

Michael Kroll’s Arduino BLE Sheild

There is a swtich on the board that lets you toggle the Serial pins going from the Arduino to the BLE Shield to be:

either: TX = 0 and RX = 1, or: TX = 2 and RX = 3

Michael Kroll’s XBee BLE Sheild

>>  http://www.mkroll.mobi/?p=627

How-To Load Firmware onto the Bluegiga Module

Wheather want to reprogram the Bluegiga module on either the Arduino BLE shield or the BLE breakout board, the steps are basically the same and require a Texas Instruments CC-Debugger! Re-burning the firmware onto the module may help solve issues if the module is no longer able to connect, or does not show up in BLE list of devices you want to connect with.

Using parts of the instructions found in this blog post:

>>  http://blog.bluetooth-smart.com/2012/09/11/programming-the-ble112-with-c-code-using-iar/

>>  http://blog.bluetooth-smart.com/2012/09/16/programming-the-ble112-using-bgscript/

Step 1) Download

TI Flash Programmer >>  http://www.ti.com/tool/flash-programmer

BLE-Shield Firmware >>  https://github.com/michaelkroll/BLE-Shield

Step 2) Power and Connect

Power the BLE board. In the case of the Arduino Shield, simply place it ontop of a powered Arduino (see photo). In the case of the BLE Breakout Board Caution: The BLE Board runs on 3.3V! Connecting it to a 5V or higher power supply will damage the chip! You can draw 3.3V from a 3.3V FTDI board. I also connected directly to a 3.7V LiPo battery and it worked fine, but not sure how good it is to do so in the long-run.

Connect programmer to BLE shield . Pins marked 1 (or with an arrow) should line-up on programmer and shield. Light on programmer should light up green to indicate it has recognized the chip.

Step 3) Open Flash-Programmer

– Select Flash image path to be the hex file (“BLE-Shield-16bytes-rx-1.0.1.hex”) inside the “firmware” folder of the BLE files.

– Select “erase, program and verify” from the check-box menu

– Press “perform actions”

– Blue “connected”/”USR” LED lights up while firmware is programming

– When progress bar reaches end, process is complete and blue light on BLE board goes off

– Now run the BLE Explorer (or similar) on your device and the BLE module should show up as something like “BLE-Shield ########”

– For more details on connecting with BLE Explorer, see the next section bellow!

How-To “Pair” your Smart Device with the BLE Module

A quick way to check your connection and Serial RX (receive), TX (transmit) is to download the BLE Explorer App by Michael Kroll from the Apple App store.

Step 1) Download

>>  http://www.mkroll.mobi/?page_id=501

Step 2) Power Your BLE Module

In the case of the Arduino Shield, simply place it ontop of a powered Arduino (see photo). In the case of the BLE Breakout Board Caution: The BLE Board runs on 3.3V! Connecting it to a 5V or higher power supply will damage the chip! You can draw 3.3V from a 3.3V FTDI board. I also connected directly to a 3.7V LiPo battery and it worked fine, but not sure how good it is to do so in the long-run.

Step 3) Run the BLE Explorer App

– Select “BLE-Shield #######” device from the menu

– Blue LED on board should light up blue to indicate connection has been made
