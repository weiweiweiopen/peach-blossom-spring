---
source: How To Get What You Want / KOBAKANT DIY
title: "Sensing with Textiles"
url: "https://www.kobakant.at/DIY/?p=6063"
postId: 6063
date: "2016-04-26T17:43:54"
modified: "2017-03-02T14:51:44"
slug: "sensing-with-textiles"
imported: "2026-05-16 10:16"
---

<!-- pbs-source:htgwyw -->
#pbs/source/htgwyw

# Sensing with Textiles

Source: https://www.kobakant.at/DIY/?p=6063

## Excerpt

April 29-30th 2016, 2-day workshop as a part of Soft Interactive Technology Course at Kunsthochschule Weissensee’s E-Lab in Berlin, Germany This workshop is only open to students of the university. This 2-day introductory workshop introduces textile students to the materials, tools and techniques to create textile sensors and how to read them with Arduino microcontroller […]

## Content

April 29-30th 2016, 2-day workshop as a part of Soft Interactive Technology Course at Kunsthochschule Weissensee’s  E-Lab in Berlin, Germany

This workshop is only open to students of the university.

This 2-day introductory workshop introduces textile students to the materials, tools and techniques to create textile sensors and how to read them with Arduino microcontroller platform. An introductory exercise to familiarize oneself with the materials and sensors, and how they work together with microcontrollers and actuators. Each students will proceed to design their own sensors and connect with the actuators they have created in previous workshop.

Schedule

Day1:

Introduction to the topic

Explore the materials

Introduction to textile sensors

Make your own sensor

Day2:

Introduction to Arduino

Reading your sensor with Arduino

Brief introduction to Arduino programming

Controlling your textile actuators with your textile sensors

Basic components of an electronics project

You can imagine how electronics projects could work by comparing how we function. The above example shows a person picking up an apple from an apple tree. He (?I am not sure of this person’ gender…) have already tasted an apple from a same tree, and this was good (tasted sweet). now this person sees a red apple on a tree. He thinks that this apple is probably ripe and decides to pick it.

sensor >> mouth (sweet) eye (red) skin (touch)

actuator >> arm/hand (pick an apple)

microcontroller/ program >> deciding if he should pick the apple or not depending on the information he has gathered.

In the case of electronics objects, it works similar. For example, in the case of water boiler, when the switch is pressed, it turns on the heating coil. When the water boils, it stops.

sensor >> switch (user interface/ pressed) thermostat (temperature)

actuator >> heating coil (heat up the water)

microcontroller/ program >> when the switch is pressed and if the water is not already boiling, turn on the heating coil. When thermostat indicates that it is boiling, turn off the coil.

Here is a good online resource to check what types of projects are made in the field of wearable technology and e-Textiles

 http://fashioningtech.com/

Analog Sensor vs Digital Sensor

When you want to control a volume of a stereo, you need an input that gives range of value like volume knob. When you want to turn on/off the stereo, you need an input device that gives two state, like switches. Let’s say that we call the range of value as analog value and input devices/ sensors that gives the range of value as Analog Sensors, while the two state value will be called as digital value and input devices/ sensors that gives two state value as Digital Sensors.

Even though the sensor gives range of input, you can always use it as two state switch as well by programming threashold. Or you can get a range of input from two state sensors, for example counting how many times a button is pushed.

So, there never be one kind of sensor is better than the other. You just need to find out what kind of input information you need, or how to interpret the information your sensor gives.

Looking Inside of a Sensor

Inside of a Toggle Switch

Inside of a Push Button

Inside of a Potentiometer

 

A small intro to electricity

(the below explanation comes from “ Getting Started in Electronics” by Forrest M. Mims III)

Ohm’s Law

 

conductor

 

How to use Multimeters

 https://learn.sparkfun.com/tutorials/how-to-use-a-multimeter

Explore the Material

We will collect samples and make a page for your swatch book.

 

Please check:

How much resistance?

What are the characteristics? (physical/ electrical)

Does it change its conductivity? if so how, what is the changing range?

Textile Sensor

You can make sensors out of these conductive textile materials. Some are good for making restive sensors that gives range of values, some are good for making contact sensors that gives two states. 

sample sensors

Explore the sample sensors with multimeters. What are the changes it makes? What is the range?

Tilt Switch

 http://www.kobakant.at/DIY/?p=201

Push Button

 

 http://www.kobakant.at/DIY/?p=48

Stretch Sensor

Knit Stretch Sensor

 http://www.kobakant.at/DIY/?p=2108

Pressure Sensor for heavy weight

 http://www.kobakant.at/DIY/?p=5689

Bend Sensor

 

 http://www.kobakant.at/DIY/?p=20

Felt Squeeze Sensor

Pick one Digital, one Analog sensors and make a copy for yourself. If you like, you can modify the design.

Reading Sensor with Arduino

Download Aruino IDE from here >>  https://www.arduino.cc/en/Main/Software

Digital Pin/ Analog Pin

Arduino’s Analog Input pins reads voltage between 0V – 5V (if running with 3.3v 0-3.3V). Digital Input pins reads voltage 0v or 5V.

Now, as we tested with the multimeters, many of our sensors changes its resistance and not voltage. We need to use our sensors to manipulate voltage that goes into the input pins so Arduino can read what is happening with our sensors.  

Voltage Divider: Resistive Sensors

You can divide the voltage by using 2 resisters.

If you have 2 exactly same resistors, the voltage gets half in the middle, like the first diagram.

As the ratio between two resisters changes, the voltage you get in the middle (between the resisters) changes accordingly.

As the analog input pins are reading the voltage input changes, we need to change the voltage that goes into the analog pins by changing the resistance connected to the analog input pin.

When you finish connecting your sensor as above, you can upload example Arduino sketch  AnalogReadSerial from (File/Examples/Basics/AnalogReadSerial)

Here is an experiment with two resister with a multumeter.

The first experiment shows two same size resister (10kohm) dividing the provided voltage (5V) in half. The multimeter is set as V– for reading direct current voltage. The probes are connected to 0V (GND) of the power supply and the middle point where two resisters meet. You can see 2.44 in the multilmeter’s display. (almost 2.5V.. maybe the resister had some range) It divides the 5V in 50/50 ratio.

In the second experiment, I changed one of the resister to 47kohm. So now the ratio of two resisters are 10/47. So, I should read 5V x 10/(10+47) = 0.877 V in theory. As you can see in multimeter, it is 0.85V it measures. Not bad!

Now, if you change one of the resister to our resistive textile sensor, it works the same. The felt sensor I tested here has about 8kohm – 100kohm resistance range. You can see how the voltage that gets divided in the middle changes as I manipulate the felt. Now, if you connect the point where multimeter is reading to the Arduino Analog input, we can read how much voltage comes in.

 

Pull Down resister: Contact Switches

When you finish connecting your contact switch as above, you can upload example Arduino sketch  DigitalReadSerial from (File/Examples/Basics/DigitalReadSerial)

Graph

If you like to see the sensor input value in more graphical way, you can also try  Graph example sketch.

This is located (File/Examples/Communication/Graph). You will need  Processing for this example.

Controlling Actuator

Now that we have the “sensing” part from the first analysis, we can also create the “brain” or decision making part and activate the “actuator”. Let’s add few lines to the AnalogReadSerial or DigitalReadSerial code and control the actuators we created in  the first workshop.

example code here

h ttps://github.com/mikst/SoftInteractiveTechnology_WS

As these textile actuators needs more current and voltage than what Arduino’s digital pins can supply (5V, 40mA max), we use transistor as switch to actuate them. For the example here, I have used TIP122, NPN Darlington Transistors.

TIP122 pinout

Embroidered Speaker

We play simple tone from Arduino according to the sensor value using tone() function. As the embroidered speaker needs a lot of current, we do not connect the Arduino digital output pin directly, but to use transistor to amplify the signal. For the workshop, we use TIP122.

 

Electromagnetic Flapping Wing

We can also control Flapping Wing with sensors. The example uses contact switch (textile push button) but you can also use analog sensor and make threshold for the sensor. As the electromagnetic coil needs more ampere than the Arduino digital pin provides, we use Transistor switch to let the power go through.
