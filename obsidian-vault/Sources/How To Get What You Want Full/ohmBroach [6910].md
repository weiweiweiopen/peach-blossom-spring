---
source: How To Get What You Want / KOBAKANT DIY
title: "ohmBroach"
url: "https://www.kobakant.at/DIY/?p=6910"
postId: 6910
date: "2017-07-28T06:02:40"
modified: "2017-08-17T17:43:58"
slug: "ohmbroach"
imported: "2026-05-16 10:16"
---

<!-- pbs-source:htgwyw -->
#pbs/source/htgwyw

# ohmBroach

Source: https://www.kobakant.at/DIY/?p=6910

## Excerpt

This wearable tool translates resistance into colour and sound.

## Content

This wearable tool translates resistance into colour and sound.

low frequency – low resistance

high frequency – high resistance

white – low resistance

yellow

green

blue

purple

red – high resistance

Process

1) COMPONENTS

footprint

datasheet

pins, leads

spacing, pitch (through-hole pitch: 0,1inch = 2.54mm)

DIP, SMD

2) SCHEMATIC

what connects to what?

3) LAYOUT

– by hand on paper….

– in a vector drawing program (Inkscape, Illustrator, Freehand, Coraldraw…)

– in a PCB layout software (KiKad, Eagle, Fritzing, 123D Circuits…)

4) LAYERS

base

conductor

“jumps”

mask

5) PRODUCTION

cut (vinyl, laser)

mill

print

etch

hand (cut, embroider, sew…)

ATtiny45/85 datasheet >>  http://www.atmel.com/images/atmel-2586-avr-8-bit-microcontroller-attiny25-attiny45-attiny85_datasheet.pdf

/*

   CODE for the ohmToolMultiMeter example

   first built for the E-Textile Summer School

   FlexPCB and ATtiny Programming Workshop

   by Hannah Perner-Wilson and Irene Posch

   07_2017, Paillard/France

   >>  http://etextile-summercamp.org/2017/summerof/fri-textile-pcbs-attiny-programming/

*/

#include 

SoftwareSerial mySerial(0, 4); // RX, TX

#include 

#ifdef __AVR__

#include 

#endif

#define pixelPIN 1

#define NUMPIXELS 1

Adafruit_NeoPixel strip = Adafruit_NeoPixel(NUMPIXELS, pixelPIN, NEO_GRB + NEO_KHZ800);

#define soundPIN 2

#define probePIN 3

#define soundMULTIPLY 40

int probeValue = 0;

int modeState = 0;

int lastModeState = 0;

int mode = 0;

int probeMIN = 0;

int probeMAX = 1023;

void setup()

{

  mySerial.begin(9600);

  pinMode(probePIN, INPUT_PULLUP); // does internal pullup command work on ATtiny? otherwise: “digitalWrite(probePIN, LOW);”

  pinMode(soundPIN, OUTPUT);

  // make light and sound to signal ON:

  strip.begin();

  strip.setPixelColor(0, strip.Color(255, 255, 255));

  strip.show(); // This sends the updated pixel color to the hardware.

  noise(soundPIN, 1 * soundMULTIPLY, 300);

  noise(soundPIN, 1023 * 20000, 300);

}

void loop()

{

  probeValue = analogRead(probePIN);

  mySerial.print(probeValue);

  mySerial.print(“\t”);

  int mappedProbeValue = constrain(probeValue, probeMIN, probeMAX);

  mappedProbeValue = map(probeValue, probeMIN, probeMAX, 0, 255);

  mySerial.println(mappedProbeValue);

 //if there is no connection turn led and sound off:

  if (mappedProbeValue > 250) {

  strip.setPixelColor(0, strip.Color(0, 0, 0)); //OFF

    strip.show(); // This sends the updated pixel color to the hardware

  }

  //if there is “direct” connection turn led white and sound on:

  else if (mappedProbeValue < 10) {
    noise(soundPIN, 10000, 1); //MAKE SOUND DEPENDANT ON PROBE VALUE!!!!
    strip.setPixelColor(0, strip.Color(255, 255, 0));
    strip.show(); // This sends the updated pixel color to the hardware
  }
  //if there is a connection turn led to colour and frequency to value:
  else {
    noise(soundPIN, mappedProbeValue * soundMULTIPLY, 1); //MAKE SOUND DEPENDANT ON PROBE VALUE!!!!
    strip.setPixelColor(0, Wheel(mappedProbeValue));
    //strip.setPixelColor(0, strip.Color(100, 0, 0));
    strip.show(); // This sends the updated pixel color to the hardware.
  }
}

// MAKE SOUND ON THE ATTINY WITHOUT THE SOUND LIBRARY:
void noise (unsigned char noisePin, int frequencyInHertz, long timeInMilliseconds) {
  int x;
  long delayAmount = (long)(1000000 / frequencyInHertz);
  long loopTime = (long)((timeInMilliseconds * 1000) / (delayAmount * 2));
  for (x = 0; x < loopTime; x++)
  {
    digitalWrite(noisePin, HIGH);
    delayMicroseconds(delayAmount);
    digitalWrite(noisePin, LOW);
    delayMicroseconds(delayAmount);
  }
}

// Input a value 0 to 255 to get a color value.
// The colours are a transition r - g - b - back to r.
uint32_t Wheel(byte WheelPos) {
  WheelPos = 255 - WheelPos;
  if (WheelPos < 85) {
    return strip.Color(255 - WheelPos * 3, 0, WheelPos * 3);
  }
  if (WheelPos < 170) {
    WheelPos -= 85;
    return strip.Color(0, WheelPos * 3, 255 - WheelPos * 3);
  }
  WheelPos -= 170;
  return strip.Color(WheelPos * 3, 255 - WheelPos * 3, 0);
}
