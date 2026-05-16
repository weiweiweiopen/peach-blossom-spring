---
source: How To Get What You Want / KOBAKANT DIY
title: "Data Logging"
url: "https://www.kobakant.at/DIY/?p=2123"
postId: 2123
date: "2010-01-05T23:45:12"
modified: "2013-07-02T08:47:40"
slug: "data-logging"
imported: "2026-05-16 10:16"
---

<!-- pbs-source:htgwyw -->
#pbs/source/htgwyw

# Data Logging

Source: https://www.kobakant.at/DIY/?p=2123

## Excerpt

For a different kind of “wireless” where data can be logged on the go over time and then downloaded to computer later. Sparkfun has a nice little module for logging up to three channels of sensor data for up to three hours and then spitting it out on command.

## Content

For a different kind of “wireless” where data can be logged on the go over time and then downloaded to computer later. Sparkfun has a nice little module for logging up to three channels of sensor data for up to three hours and then spitting it out on command. 

See the following examples:

Sensor Sleeve >>  http://www.kobakant.at/DIY/?p=2542

Broach >>  http://www.kobakant.at/DIY/?p=4421

>> More detailed documentation from the MIT Engaging Health Workshop:

 http://hlt.media.mit.edu/wiki/pmwiki.php?n=Main.ULog

The uLog is an analog logging device that can log three channels of analog data (10 bit=1024 values) simultaneously for about 2 hours. It uses the ATtiny24 microcontroller with an AT45DB161D 16Mbit flash memory IC. It samples at 50Hz (=50 times a second).

uLog runs on 3.3V (5V will kill it!!! Or at least I think this is what happened to my first board, and in the AT45DB161D datasheet is says “Single 2.5V – 3.6V or 2.7V – 3.6V Supply”)

If connecting with a Sparkfun FT232 Basic 5V breakout board, you only want to connect TX, RX and ground and power seperately!!!

If connecting with a Sparkfun FTDI Basic 3.3V breakout board you can power it from the the FTDI board directly

When connecting/communicating with uLog to read/erase data use 38400 baudrate!!!

Type “r” for read and “e” for erase

Erasing the flash sets all addresses to 0xFFFF, and reading dumps all the data up to the first 0xFFFF

If there’s no UART line attached it starts sampling from the sensor inputs (if no sensors are attached it will sample noise)

Blinks at second intervals when reading sensor data (powered up and not connected to UART = rx,tx,gnd)

Does not blink or light up at all when communicating over serial (powered up and connected to UART = rx,tx,gnd)

Blinks like crazy when erasing data

If there is a UART line (rx, tx) attached when you switch on or power the uLog it spits out a “?” over the serial port and waits for user input. Sending an “r” over the serial port reads all the stored (logged) data in HEX values up until the first empty (0xFFFF) value.

Sending an “e” over the serial port erases all the memory and sets all addresses to 0xFFFF.

 USB, connecting as follows:

FTDI     —–     uLog

+3.3V  —–     +3.3V

GND     —–     GND

RX        —–     TX

TX        —–     RX

If your FTDI board is 5V you’ll need to power the uLog separately, either with the power supply you use for reading sensor data or using a volatage regular to power down the USB 5V. Still connect the GND from the FTDI to the uLog, connecting as follows (as seen in photos):

FTDI     —–     uLog

GND     —–     GND

RX        —–     TX

TX        —–     RX

uLog     —–     3.3V power supply

+3.3V  —–     +3.3V

GND    —–     GND

Sparkfun uLog >>  http://www.sparkfun.com/commerce/product_info.php?products_id=9228

Sparkfun FTDI Basic Breakout – 3.3V (5V also possible) >>  http://www.sparkfun.com/commerce/product_info.php?products_id=8772

Setup for writing sensor data to memory from one (Z) analog input

Setup for reading sensor data from memory via USB to serial port of computer
