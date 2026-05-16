---
source: How To Get What You Want / KOBAKANT DIY
title: "Capacitive Fabric Slider/Wheels"
url: "https://www.kobakant.at/DIY/?p=6607"
postId: 6607
date: "2017-04-20T16:23:23"
modified: "2017-05-28T15:56:07"
slug: "capacitive-fabric-sliders-and-wheels"
imported: "2026-05-16 10:16"
---

<!-- pbs-source:htgwyw -->
#pbs/source/htgwyw

# Capacitive Fabric Slider/Wheels

Source: https://www.kobakant.at/DIY/?p=6607

## Excerpt

Flickr set >> https://www.flickr.com/photos/plusea/albums/72157682852303805 Video: Front and back: Capacitive Sensing Cap sense shapes: Circular sliders: Linear sliders: Code /* Visualizes the movement of a finger over a series of capacitive sensors. >> http://www.kobakant.at/DIY/?p=6607 Based on the CVDSense Library Demo Sketch by Admar Schoonen 2016. >> https://github.com/admarschoonen/CVDSensor IMPORTANT: Needs a minimum of 2 capacitive sensors. When […]

## Content

Flickr set >>  https://www.flickr.com/photos/plusea/albums/72157682852303805

Video:

Front and back:

Capacitive Sensing

Cap sense shapes:

Circular sliders:

 

Linear sliders:

 

 

Code

/*

   Visualizes the movement of a finger over a series of capacitive sensors.

   >>  http://www.kobakant.at/DIY/?p=6607

   Based on the CVDSense Library Demo Sketch by Admar Schoonen 2016.

   >>  https://github.com/admarschoonen/CVDSensor

   IMPORTANT: Needs a minimum of 2 capacitive sensors. When using only one

   sensor, set N_SENSORS to 2 and use an unused analog input pin for the second

   sensor.

*/

#include 

#ifdef __AVR__

#include 

#endif

#define PIN 6

#define NUMPIXELS 5

Adafruit_NeoPixel strip = Adafruit_NeoPixel(NUMPIXELS, PIN, NEO_GRB + NEO_KHZ800);

#include 

#define N_SENSORS 5

int pinRemap[] = {1,4,3,2,0};

#define N_MEASUREMENTS_PER_SENSOR	16  // Number of measurements per sensor to take in one cycle. More measurements means more noise reduction / spreading, but is also slower

CvdSensors cvdSensors;  // cvdSensors is the actual object that contains all the sensors

void setup()

{

  Serial.begin(115200);

  cvdSensors.data[0].pin = 0; /* Analog pin 0 */

  cvdSensors.data[0].enableSlewrateLimiter = true;

  cvdSensors.data[1].pin = 1; /* Analog pin 2 */

  cvdSensors.data[1].enableSlewrateLimiter = true;

  cvdSensors.data[2].pin = 2; /* Analog pin 2 */

  cvdSensors.data[2].enableSlewrateLimiter = true;

  cvdSensors.data[3].pin = 3; /* Analog pin 2 */

  cvdSensors.data[3].enableSlewrateLimiter = true;

  cvdSensors.data[4].pin = 4; /* Analog pin 2 */

  cvdSensors.data[4].enableSlewrateLimiter = true;

  cvdSensors.data[5].pin = 5; /* Analog pin 2 */

  cvdSensors.data[5].enableSlewrateLimiter = true;

  cvdSensors.printScanOrder();

  strip.begin();

}

void loop()

{

  static int prev = millis();

  cvdSensors.sample();

  for (int i = 0; i < NUMPIXELS; i++) {
    int sensorData = cvdSensors.data[pinRemap[i]].delta;
    Serial.print(sensorData);
    Serial.print("\t");
    if (sensorData > 100 || sensorData < -100) {
      strip.setPixelColor(i, strip.Color(100, 0, 0)); // Moderately bright green color.
      strip.show(); // This sends the updated pixel color to the hardware.
  }
  else {
    strip.setPixelColor(i, strip.Color(0, 0, 0));
      strip.show();
    }
  }
  Serial.println();
  delay(10);
}

 

References

Guidelines

CAPACITIVE SENSING MADE EASY, Part 2 DesignGuidelines:

>>  http://www.cypress.com/file/114086/download

Capacitive Touch Sensing Layout Guidelines:

>>  http://www.mouser.com/pdfdocs/semtech-capacitive-touch-sensing-layout-guidelines.pdf

Hardware Design for Capacitive Touch:

>>  https://www.silabs.com/documents/public/application-notes/AN0040.pdf

CNMAT publication

An Accessible Platform for Exploring Haptic Interactions with Co-located Capacitive and Piezoresistive Sensors

>>  http://dl.acm.org/citation.cfm?id=2680571

TI capsenselibrary

>>  http://www.ti.com/tool/capsenselibrary

Pressure and Distance Sensing by admarschoonen

More in depth theory of capacitive sensing, for example discussing different methods of capacitive measurement (RC method, CVD method or others), guards / shields to make it sensitive to only one side without sacrificing performance etc.

>>  http://etextile-summercamp.org/2016/pressure-and-distance-sensing/

>>  https://github.com/admarschoonen/resistive_cap_touch

capsense_techniques

>>  https://github.com/admarschoonen/resistive_cap_touch/blob/master/capsense_techniques_2016.pdf

pressure_and_presence_sensors_in_textile

>>  https://github.com/admarschoonen/resistive_cap_touch/blob/master/pressure_and_presence_sensors_in_textile_2016.pdf

Rachel Freire’s Version

>>  https://www.instructables.com/id/Capacitive-Wheel-Fabric-Sensor/
