---
source: How To Get What You Want / KOBAKANT DIY
title: "Arduino as Bluetooth HID"
url: "https://www.kobakant.at/DIY/?p=3310"
postId: 3310
date: "2012-01-01T15:04:11"
modified: "2013-07-02T08:35:56"
slug: "arduino-as-bluetooth-keyboard"
imported: "2026-05-16 10:16"
---

<!-- pbs-source:htgwyw -->
#pbs/source/htgwyw

# Arduino as Bluetooth HID

Source: https://www.kobakant.at/DIY/?p=3310

## Excerpt

Using Sparkfun’s Bluetooth Modem – BlueSMiRF HID to interface between an Arduino Pro Mini and a desktop Computer as an Human Interface Device (HID). The default mode of the BlueSMiRF HID is as a keyboard (which is very easy to set up), but you can also use it in HID raw mode (see user manual) […]

## Content

Using Sparkfun’s  Bluetooth Modem – BlueSMiRF HID to interface between an Arduino Pro Mini and a desktop Computer as an Human Interface Device (HID). The default mode of the BlueSMiRF HID is as a keyboard (which is very easy to set up), but you can also use it in HID raw mode (see user manual) to send keyboard, mouse, joystick combos. I am still trying to figure out if there is also a standard way to SEND signals TO the HID Bluetooth modem to trigger events, such as force feedback…

Also see the Penguin Interface project >>  http://www.plusea.at/?page_id=2700

Setup Instructions

Materials and Tools

To replicate this setup you will need:

– Arduino Mini Pro >>  http://www.sparkfun.com/products/9218

– FTDI board >>  http://www.sparkfun.com/products/9716

– Mini USB cable >>  http://www.sparkfun.com/products/598

– BlueSmirf HID >>  http://www.sparkfun.com/products/10938

– Male headers >>  http://www.sparkfun.com/products/553

– Female headers >>  http://www.sparkfun.com/products/115

– Breadboard >>  http://www.sparkfun.com/products/8800

– Some jumper wire >>  http://www.sparkfun.com/products/8024

– Battery >>  http://www.sparkfun.com/products/9876

– Soldering iron and solder

– Computer with Bluetooth

– Arduino software >>  http://arduino.cc/en/Main/Software

About the BlueSMiRF HID

Download Roving Network’s RN-HID-UM manual >>  http://dlnmh9ip6v2uc.cloudfront.net/datasheets/Wireless/Bluetooth/RN-HID-User%20Guidev0%2005.pdf

Some useful info on the Sparkfun product page’s comments section >>  http://www.sparkfun.com/products/10938

Human Interface Device Profile (HID) >>  https://www.bluetooth.org/Building/HowTechnologyWorks/ProfilesAndProtocols/HID.htm

HID Information >>  http://www.usb.org/developers/hidpage/

Universal Serial Bus (USB) HID Usage Tables >>  http://www.usb.org/developers/devclass_docs/Hut1_12v2.pdf

Arduino as a HID Keyboard code by Andrew McDaniel (did not work for me with BlueSmirf Bluetooth modem!) >>  http://arduino.cc/forum/index.php?action=printpage;topic=99.0

For whatever reason the ASCII Codes-HID Report Tables are missing from Roving Network’s RN-HID-UM user manual on page 12. Through trial and error i found that the following HEX codes correspond with the following keys strokes on a Mac OSX:

right arrow = 0x07;

left arrow = 0x0B;

up arrow = 0x0E;

down arrow = 0x0C;

enter key = 0x0D;

Solder Headers

Program Arduino

Arduino code:

// test code for sending keystrokes from arduino

// to computer via HID bluetooth module

void setup() {

Serial.begin(115200); // begin serial communication at 115200 baud rate

}

void loop() {

Serial.println(“hello world”);  // write hello world

delay(1000); // delay one second

}

Circuit Connections

 BlueSMiRF HID >>  Arduino Mini:

RTS >> GRN = CTS

RX >> TX

TX >> RX

VCC >> VCC

CTS >> GND

GND >> BLK = GND

Connections on the Arduino:

BLK = black = GND

GRN = green = CTS

RS232 Interface:

TX = Output = Transmitted data

RX = Input = Received data

GND = Signal ground

CTS = Input = Clear to send

RTS = Output = Request to send

VCC = Power supply

Breadboarded Connections

Soldered Adapter Connection

Pair with Bluetooth Device

Pairing Bluetooth device on Mac >>  http://www.rioleo.org/setting-up-the-arduino-pro-mini-and-bluetooth-mate-on-mac.php

Pairing Bluetooth device on Windows >>  http://jondontdoit.blogspot.com/2011/11/bluetooth-mate-tutorial.html

Steps:

– power your circuit and the light on your Bluetooth modem should blink red

– open the Bluetooth preferences of your computer and opt to pair with a new Bluetooth device

– the circuit should show up as a FireFly Bluetooth device with an address similar to this: 00-06-66-43-A2-29

– opt to connect with passcode, and type “1234”, which is the generic passcode

– The light on your BlueSmirf Modem should turn a steady green

– it will try to identify the circuit as a keyboard, press a button on your real (other) keyboard and the next step will let you skip the step and manually input the type of keyboard you want the circuit to be recognized as

– now that your Bluetooth modem has been recognized as a keyboard you want to quickly open a text editor and it should automatically be printing “hello world”

“Hello World”

“hello world” with breadboarded circuit:

“hello world” with adapter circuit:

Video

Problems Disconnecting

When i disconnect the Bluetooth modem from the power, my computer does not automatically re-connect to it when i re-power it.

I have to go back into the Bluetooth preferences and opt to add a new device, then select “Okay” when asked “Your computer is already paired with that device. Do you wish to remove the pairing and setup the device again?”

HID to SPP to HID to SPP…

The Bluetooth modem can switch back and forth between an HID device and a device with a serial port connection (SPP mode). For this to happen the Arduino needs to put the Bluetooth modem into command mode ($$$) and send the following commands:

$$$ = command mode

S~,0 = enables SPP protocol

R,1 = reboot using SPP

$$$ S~,0 R,1

$$$ = command mode

S~,6 = enables HID protocol

R,1 = reboot using HID

$$$ S~,6 R,1
