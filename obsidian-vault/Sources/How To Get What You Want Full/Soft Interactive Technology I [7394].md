---
source: How To Get What You Want / KOBAKANT DIY
title: "Soft Interactive Technology I"
url: "https://www.kobakant.at/DIY/?p=7394"
postId: 7394
date: "2018-12-02T14:56:50"
modified: "2019-01-06T00:08:25"
slug: "soft-interactive-technology-i"
imported: "2026-05-16 10:16"
---

<!-- pbs-source:htgwyw -->
#pbs/source/htgwyw

# Soft Interactive Technology I

Source: https://www.kobakant.at/DIY/?p=7394

## Excerpt

Nov 29,30,Dec 4,9,2018 10:00- 17:00 elab Weissensee Art Academy Berlin. Assignment The next 2 days will be something like mini hackathon. It is time for you to explore what these textile sensors can do as interface and think about different types of interaction with digital technology. For this, we give ourselves a framework/story. Inspired by […]

## Content

Nov 29,30,Dec 4,9,2018 10:00- 17:00 elab Weissensee Art Academy Berlin.

Assignment

The next 2 days will be something like mini hackathon. It is time for you to explore what these textile sensors can do as interface and think about different types of interaction with digital technology. For this, we give ourselves a framework/story.

Inspired by “Desert Island”, a BBC radio show, the theme of our hackathon is following.

Pick one “app” or function from your phone or computer that you would take if you were to be cast away to outer space, to a desert planet.

– Why did you choose this app?

– Analyze how you normally control/interface this app.

– Imagine how you would use this app if you were in space/desert planet

*We assume all the infrastructure to use the app (internet, GPS.. so on) is functioning exactly same as on earth so we can focus on interaction part.

For example, I can choose Map. I use this often in my everyday life, and I think it can be handy if I am on Moon or Mars exploring the terrain.

My interaction analysis are following:

– input name of a place or an address, sometimes get direction to there (typing, active interaction)

– Check where I am and my orientation (GPS, compass sensor, passive interaction)

– zoom in/ out of the map (multi finger touch, active)

– I am visually looking at the map (display)

– I hear voice navigation to my destination (display)

Now I can plan new sets of interaction for my space excursion and decide which of them will be implemented with e-texitile sensors.

The 2 days can be spent to explore what kind of sensor construction will achieve the interaction you planned, what kind of materiality, aesthetic is possible for your design, how it can be integrated in garment and iterate your design.

Many of the way we use our digital devices are influenced by the design of the device. So if you are designing a new device, you can also design new ways to interact with the digital device. Here are very nice critical analysis of how we came to get used to some of the strange interaction we perform with our digital devices. (see the book)

Curious Rituals >>  http://curiousrituals.nearfuturelaboratory.com/#introduction

  

Assignment Outcome

Meditative Star Watching by Juni and Berit

    

Vogue Light Measure by Kirsten and Antonia

    

 

Touch my Shoulder by Elena and Hannah Lu

     

Photos from the workshop
 
.flickr_badge_image {margin:0px;display:inline;}
.flickr_badge_image img {border: 0px solid #666666 !important; padding:0px; margin:2px;}
#flickr_badge_wrapper {width:600px;text-align:left}

 Photos on flickr album

Book Recommendation:

Spacesuit: Fashioning Apollo

by Nicholas de Monchaux

ISBN-13: 978-0262015202

 http://www.fashioningapollo.com/

Spacesuits: The Smithsonian National Air and Space Museum Collection

by Amanda Young

ISBN-13: 978-1576874981

 

Notes from the tuturials

Multimeter

We can not see the electrons flowing. So we can not tell by looking if there is an electrical connection, or how much electrical resistance between one end to the other end of the circuit or a material.

To measure this, we use a tool called multimeter. This will be your friend throughout the workshop. Here is how to use it.

Check connection

 

turn the dial to arrow/sound sign. Place the probe to the to end of the part where you want to check the electrical connection. If there are connection, it will beep.

Check Resistance

 

Turn the dial to ohm mark part. there are few numbers on the ohm part, start from the smallest, or if you know roughly how much it should be, start with closest one. If it is on the diral 200 ohm, it means it will measure the resistance maximum 200ohm. If the resistance is bigger than 200ohm, it shows 1. like in the picture. In this case, turn the dial to bigger maximum range (for example 2000, or 20k (20,000)) to see if you start to see a number.

 

 

Here is an example on how to read the measured resistance. The dial is set to 20M ohm (20,000,000 ohm), and you see 2.19 in the display. Where the period is shows the scale (if it is Mega or Kilo or without any scale). Since you are on Mega scale, this is 2.19 Mega Ohm (2,190,000 ohm). This is a bit confusing as if you are on 200k ohm dial and see 3.8, it is still 3.8 Kilo ohm (3,800 ohm). The number on your dial is not a multiplier. It just shows which scale you are in, and what is the maximum reading range.

Textile Sensors

Push Button

 

 http://www.kobakant.at/DIY/?p=48

Tilt Switch

 

 http://www.kobakant.at/DIY/?p=201

Stroke Sensor

 http://www.kobakant.at/DIY/?p=792

Button Switch

 http://www.kobakant.at/DIY/?p=7349

Knit Stretch Sensor 

 http://www.kobakant.at/DIY/?p=2108

 

      

Bend Sensor 

 http://www.kobakant.at/DIY/?p=20

     

Pressure Sensor for heavy weight

 http://www.kobakant.at/DIY/?p=5689

      

Stretch Sensor 

 

      

Conductive Wool: Needle Felt Squeeze Sensor

You can mix a bit of wool to increase the range of resistance change.

 

       

eeonyx non-woven: Slider/ potentiometer

 http://www.kobakant.at/DIY/?p=543

 http://www.kobakant.at/DIY/?p=2331

Adjustable Slider

photos >>  https://www.flickr.com/photos/plusea/albums/72157685063387786

>>  http://www.kobakant.at/DIY/?p=6886

 

Voltage Divider

If you have 2 exactly same resistors, the voltage gets half in the middle, like the first diagram. As the ratio between two resisters changes, the voltage you get in the middle (between the resisters) changes accordingly.

One can calculate this by

Supply voltage (5v) x resistanceA / (resistanceA + resistanceB) = divided voltage

So much of a theory, let’s try this to see if it really works. Here is an experiment with two resister with a multumeter.

The first experiment shows two same size resister (10kohm) dividing the provided voltage (5V) in half. The multimeter is set as V– for reading direct current voltage. The probes are connected to 0V (GND) of the power supply and the middle point where two resisters meet. You can see 2.44 in the multilmeter’s display. (almost 2.5V.. maybe the resister had some range) It divides the 5V in 50/50 ratio.

In the second experiment, I changed one of the resister to 47kohm. So now the ratio of two resisters are 10/47. So, I should read 5V x 10/(10+47) = 0.877 V in theory. As you can see in multimeter, it is 0.85V it measures. Not bad!

Now, if you change one of the resister to our resistive textile sensor, it works the same. The felt sensor I tested here has about 8kohm – 100kohm resistance range. You can see how the voltage that gets divided in the middle changes as I manipulate the felt. Now, if you connect the point where multimeter is reading to the Arduino Analog input, we can read how much voltage comes in.

 

 

 Reading Sensor with Arduino 

In this course we used Arduino and its IDE to read sensors we made. You can download IDE from here >>  https://www.arduino.cc/en/Main/Software

Once you get your Arduino connected, we did an exercise with Blink example >>  https://www.arduino.cc/en/Tutorial/Blink

 

Then you can connect Analog sensor you have made with above circuit connection. You can upload AnalogReadSerial example >>  https://www.arduino.cc/en/Tutorial/AnalogReadSerial and read how your sensor is behaving.

When you are reading digital sensor(contact switch), then you can simply replace the sensor from above circuit to your digital sensor and move the reading pin from Analog Input Pins to Digital Pins. Make sure in your setup function to set the PinMode of your reading pin to INPUT.

If your fixed resistor on your voltage divider is too small (less than 1k ohm) it may not work as your digital sensor’s internal resistance can be high. In this case, switch your fixed resistor to something bigger (1k or bigger) and it should work.

Reference Tutorial:

 https://www.arduino.cc/reference/en/language/structure/control-structure/if/

 https://www.arduino.cc/reference/en/language/functions/math/map/

 https://www.arduino.cc/reference/en/language/functions/math/constrain/

 https://www.arduino.cc/en/Tutorial/PWM

 https://www.arduino.cc/en/Tutorial/TonePitchFollower?from=Tutorial.Tone2

 https://www.arduino.cc/en/Tutorial/ToneMelody?from=Tutorial.Tone

The last thing we tried is Capacitive sensor.

Here is the tutorial to Capacitive sensor >>  https://playground.arduino.cc/Main/CapacitiveSensor?from=Main.CapSense

Materials

Highly conductive textile materials

Copper Ripstop Fabric Shieldex Kassel

Company:  Statex

Characteristics: Corrosion proof copper-silver plated polyamide ripstop fabric, < 0.03 Ohms/cm2 surface resistivity.

Shieldex Technik-tex 

Company:  Statex

Characteristics: Silver plated knitted fabric, 78% Polyamide + 22% Elastomer plated with 99% pure silver, < 2 Ohms/cm2 surface resistivity (front/visible side). stretchy in one direction

 

High Flex 3981 7X1 

company:  Karl Grimm 

Characteristic: Very conductive, Solder-able

Shieldex Shieldex 235/34

company: Statex

Characteristic: Shieldex 235/34 dtex 4-ply HC: Silver plated, 50 Ω/m ± 10 Ω/m

Elitex Fadenmaterial Art Nr. 235/34 PA/Ag

company:  Imbut GmbH 

Characteristic: silver conductive thread (100% polyamid beschichtet mit silber

Materials: Resistive (not so conductive) textile materials

Eeonyx non woven carbon resistive

Company:  Eeonyx

Characteristics: Resistive material (2k), non woven, can be used to make pressure or bend sensor

Eeonyx stretch woven carbon resistive

Company:  Eeonyx

Characteristics: Resistive material (2k), knit/ jersey, Stretch in both direction. Can be used to make pressure or stretch sensor

 

Velostat

Company : 3M

We bought it from lessEMF, but 3M produces it and there are more retailers.

Characteristics: Piezo resistive. Changes its resistance when pressed. Good for pressure sensors.

Nm10/3 conductive yarn

Company:  plug and wear

Characteristics: Nm10/3 conductive yarn, 80% polyester 20% stainless steel, light grey, Surface resistance < 100000ohm

conductive wool

Company: Bekaert

Characteristic: Wool fiber mixed with stainless steel fiber, Suitable for felting
