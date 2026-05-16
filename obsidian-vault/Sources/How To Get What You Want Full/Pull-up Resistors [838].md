---
source: How To Get What You Want / KOBAKANT DIY
title: "Pull-up Resistors"
url: "https://www.kobakant.at/DIY/?p=838"
postId: 838
date: "2009-06-07T15:45:00"
modified: "2016-05-09T14:30:26"
slug: "pull-up-resistors"
imported: "2026-05-16 10:16"
---

<!-- pbs-source:htgwyw -->
#pbs/source/htgwyw

# Pull-up Resistors

Source: https://www.kobakant.at/DIY/?p=838

## Excerpt

Voltage divider, variable resistor, pull-up, pull-down….???

## Content

Voltage divider, variable resistor, pull-up, pull-down….???

External Pull-Up resistors

There are various ways to wire or sew external pull-up resistors:

Diagram of a Pull-Down resister for a switch

You need a pull-up or pull-down resister when you want to read a contact switch or button (i.e. push button). If you have pull-up resister, you will see 0V(LOW) when you push the button. If you have pull-down resister, you will see 5V(HIGH) when you push the button on your digital pin reading. Here is a diagram showing why you need a pull-down resister.

Internal Pull-Up Resistors

For the longest time I had no idea that I could simply set internal pull-up resistors using a single line of code! But the Atmel chips that Arduino uses have internal resistors that can be toggled on or off for every digital and analog input pin (except A6 and A7 on some boards).

Digital

For setting the internal pull-up resistors for digital input pins, the code will look like the following:

pinMode(2, INPUT);

digitalWrite(2, HIGH);       // turn on internal pullup resistor for digital pin 2

*NEW*: pinMode(2, INPUT_PULLUP);

Analog

For most of our fabric sensors using Velostat the internal 20 K Ohm pull-up resistors of the Arduino are just fine. To set these you’ll need to include the following lines of code in the setup function of your Arduino sketch. The analog inputs 0-5 can be addressed as digital outputs using the numbers 14-19:

pinMode(A0, INPUT);

digitalWrite(14, HIGH);            // set internal pullup resistor for analog pin 0 

*NEW*: pinMode(A0, INPUT_PULLUP);

Understanding Voltage Measurement

Ohm’s Law: V = I x R

Voltage divider:

Diagrams explaining voltage divider and pull-up resistor:

Links

>>  http://arduino.cc/en/Tutorial/AnalogInputPins

>>  http://arduino.cc/en/Tutorial/DigitalPins

The following CNMAT and Wikipedia entries cover all the important explanations of why you need and how to place pull-up or pull-down resistors.

>>  http://cnmat.berkeley.edu/recipe/how_and_why_add_pull_and_pull_down_resistors_microcontroller_i_o_

>>  http://en.wikipedia.org/wiki/Pull-up_resistor
