---
source: How To Get What You Want / KOBAKANT DIY
title: "Tone of the Things"
url: "https://www.kobakant.at/DIY/?p=9649"
postId: 9649
date: "2022-10-19T19:53:38"
modified: "2022-10-26T18:52:16"
slug: "tone-of-the-things"
imported: "2026-05-16 10:16"
---

<!-- pbs-source:htgwyw -->
#pbs/source/htgwyw

# Tone of the Things

Source: https://www.kobakant.at/DIY/?p=9649

## Excerpt

This is a part of the winter semester course 2022/23 at the Weissensee Art Academy Berlin. The workshop takes place on the October 24/26 at the eLab, KHB Berlin. ARDUINO 101 “Arduino is an open source computer hardware and software company, project, and user community that designs and manufactures single-board microcontrollers and microcontroller kits for […]

## Content

This is a part of the winter semester course 2022/23 at the Weissensee Art Academy Berlin. The workshop takes place on the October 24/26 at the eLab, KHB Berlin.

ARDUINO 101

“Arduino is an open source computer hardware and software company, project, and user community that designs and manufactures single-board microcontrollers and microcontroller kits for building digital devices and interactive objects that can sense and control objects in the physical and digital world.” ( wikipedia>>)

Arduino website >>  https://www.arduino.cc/

you can download the Arduino IDE from here >>  https://www.arduino.cc/en/software (Scroll down and please download Arduino IDE 1.8.19)

microcontroller vs computer

>>  https://www.quora.com/What-is-the-difference-between-a-microcontroller-and-a-computer?

blink LED exercise >> Arduino IDE File/Examples/0.1Basic/Blink

more in detail>>  https://www.kobakant.at/DIY/?p=8852

TONE: how do you make sound?

SOUND

In physics, sound is a vibration that propagates as an acoustic wave, through a transmission medium such as a gas, liquid or solid. In human physiology and psychology, sound is the reception of such waves and their perception by the brain.[1] Only acoustic waves that have frequencies lying between about 20 Hz and 20 kHz, the audio frequency range, elicit an auditory percept in humans. ( https://en.wikipedia.org/wiki/Sound#Waves)

diagram of a speaker

ELECTROMAGNET

An electromagnet is a type of magnet in which the magnetic field is produced by an electric current. The magnetic field disappears when the current is turned off. Electromagnets usually consist of a large number of closely spaced turns of wire that create the magnetic field. The wire turns are often wound around a magnetic core made from a ferromagnetic or ferrimagnetic material such as iron; the magnetic core concentrates the magnetic flux and makes a more powerful magnet.
(from  https://en.wikipedia.org/wiki/Electromagnet)

>>  https://www.youtube.com/watch?v=bht9AJ1eNYc

min 19:40: Left Hand Rule for Coils

Experiment1: let’s make a small coil and see if it becomes magnetic

What happens when a magnet is near by?

more on electromagnetism here >>  https://www.kobakant.at/DIY/?p=8097

Driving from Arduino >> delay(10) to delay(1)

tone() function >>  https://www.arduino.cc/reference/en/language/functions/advanced-io/tone/

Inspirations/ Reference projects:

CHIJIKINKUTSU
Nelo Akamatsu
>>  http://www.neloakamatsu.jp/chijikinkutsu-eng.html

Phase In, Phase Out
EJTech
>>  https://ejtech.studio/Phase-In-Phase-Out

Chants Magnétiques
Claire Williams
>>  http://www.xxx-clairewilliams-xxx.com/projets/chants-magnetiques/

Fabric Speaker
 https://www.kobakant.at/DIY/?p=5935

 

SOLENOID

In engineering, a solenoid is a device that converts electrical energy to mechanical energy, using an electromagnet formed from a coil of wire. The device creates a magnetic field from electric current, and uses the magnetic field to create linear motion (  https://en.wikipedia.org/wiki/Solenoid_(engineering))

You can also make your own solenoid with coil and nail like this one. 

watch a movie here >>  Suicidal Teapot

Transistor Switch

Details here >>   https://www.kobakant.at/DIY/?p=6118

For controlling Solenoid, the Arduino’s digital output pin does not provide enough current to move Solenoid (Arudino pins gives out max 40mA). So instead of directly powering the Solenoid from the pin, we use  transistor as a switch. In this course, we use IRLR8743 N-channel mosFET (Field Effect Transistor). Transistor works as switch that turns on/off when it receives voltage in its gate pin. 

When you connect your solenoid to the Transistor switch circuit, you should be able to control (on/off) the solenoid from your Arduino’s digital output pins.

*1 there is a diode between solenoid output cable. This is because electromagnetic coil could discharge when the gate is closed and it can damage the gate pins. The diode let the extra charge to flow to VCC and protects the pins.

*2 There is a 100k ohm resister between gate pin and GND. This is to pull-down the gate pin so when the Arduino is not switched on, it prevents the transistor switch to accidentally open.

or here is what I actually used in the course

INPUT: how does Arduino know about the world

push button

You can use  digitalRead() to read push button status and further control Solenoid or Speaker

potentiometer 

A potentiometer is a three-terminal resistor with a sliding or rotating contact that forms an adjustable voltage divider.[1] If only two terminals are used, one end and the wiper, it acts as a variable resistor or rheostat.

The measuring instrument called a potentiometer is essentially a voltage divider used for measuring electric potential (voltage); the component is an implementation of the same principle, hence its name. ( https://en.wikipedia.org/wiki/Potentiometer)

 

Connect the potentiometer’s outer left leg to 5V, middle leg to A0 (or any Analog Input pins) and outer Right leg to GND. This makes voltage divider cirucit. You will see the range of 0-1023 reading on Analog Input pin when you use  AnalogRead().

Piezo element/ contact microphone

The principle of operation of a piezoelectric sensor is that a physical dimension, transformed into a force, acts on two opposing faces of the sensing element. (https://en.wikipedia.org/wiki/Piezoelectricity#Sensors)

how to use Piezo sonsor details >>  https://learn.sparkfun.com/tutorials/piezo-vibration-sensor-hookup-guide

DIY sensor 

(pressure sensor/ felt squeeze/ stretch)
Paper Pressure Sensor >>  https://www.kobakant.at/DIY/?p=8936
Fabric Pressure Sensor >>  https://www.kobakant.at/DIY/?p=20
Felt squeeze sensor >>  https://www.kobakant.at/DIY/?p=7795
Felted PomPom>>  https://www.kobakant.at/DIY/?p=2395
circular knit stretch sensor>>  https://www.kobakant.at/DIY/?p=2108

 

voltage divider circuit with textile sensors

int sensorValue;
int delaySpeed;

void setup() {
  // solenoid is connected to 12, set it as output pin
  pinMode(12, OUTPUT);
  // serial communication
  Serial.begin(9600);
}

void loop() {
  // read the sensor connected to A2
  sensorValue = analogRead(A2);

  // print the sensorValue to serial plotter/ monitor
  Serial.print(0); // draw line at 0 to set min point for the plotter
  Serial.print(" "); // space as separator for the plotter lines
  Serial.print(1023); // draw line at 1023 to set max point for the plotter
  Serial.print(" "); // space as separator for the plotter lines
  Serial.println(sensorValue);

  // scale the sensorValue to the amount of delay time.
  // the more squeeze, the sensorValue goes high, and the delay time gets smaller
  delaySpeed = map(sensorValue,200, 800, 500, 50 );

  // constrain the scaled value within the scale (100 - 2000) you aim  
  delaySpeed = constrain(delaySpeed, 50, 500);

    // control the solenoid
    digitalWrite(12, HIGH);
    delay(50); // the solenoid is on for 50ms
    digitalWrite(12, LOW);
    delay(delaySpeed); // the solenoid is off for the time controlled by the sensor
 
}
