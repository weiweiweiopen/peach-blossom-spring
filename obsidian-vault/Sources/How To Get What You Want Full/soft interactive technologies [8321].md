---
source: How To Get What You Want / KOBAKANT DIY
title: "soft interactive technologies"
url: "https://www.kobakant.at/DIY/?p=8321"
postId: 8321
date: "2020-05-21T08:50:29"
modified: "2021-12-10T18:34:27"
slug: "soft-interactive-technologies"
imported: "2026-05-16 10:16"
---

<!-- pbs-source:htgwyw -->
#pbs/source/htgwyw

# soft interactive technologies

Source: https://www.kobakant.at/DIY/?p=8321

## Excerpt

This is a course note for the Soft Interactive Technology course at the Art Academy Weissensee Berlin. The course is normally given as a series of hands-on workshops, but due to our difficulty of meeting each other in physical spaces, it is developed as an online course for the year. It was first given in […]

## Content

This is a course note for the Soft Interactive Technology course at the Art Academy Weissensee Berlin. The course is normally given as a series of hands-on workshops, but due to our difficulty of meeting each other in physical spaces, it is developed as an online course for the year.   It was first given  in summer semester 2020, and was repeated in winter semester 20/21  and winter semester 21/22

The course took place as weekly online course.  The hand book PDF is here >> 

Meet the Material 

 

 

Highly conductive textile materials

Copper Ripstop Fabric Shieldex Kassel

Company:  Statex

Characteristics: Corrosion proof copper-silver plated polyamide ripstop fabric, < 0.03 Ohms/cm2 surface resistivity.

Shieldex Technik-tex 

Company:  Statex

Characteristics: Silver plated knitted fabric, 78% Polyamide + 22% Elastomer plated with 99% pure silver, < 2 Ohms/cm2 surface resistivity (front/visible side). stretchy in one direction

High Flex 3981 7X1 

company:  Karl Grimm 

Characteristic: Very conductive, Solder-able. 

Shieldex Shieldex 235/34

company:  Statex 

Characteristic: Shieldex 235/34 dtex 4-ply HC: Silver plated, 50 Ω/m ± 10 Ω/m. 

Elitex Fadenmaterial Art Nr. 235/34 PA/Ag

company:  Imbut GmbH 

Characteristic: silver conductive thread (100% polyamid beschichtet mit silber. 

A small intro to electricity
(the below explanation comes from “ Getting Started in Electronics” by Forrest M. Mims III)

Ohm’s Law
 

conductor
 

How to use Multimeters

 https://learn.sparkfun.com/tutorials/how-to-use-a-multimeter

Analog Sensor vs Digital Sensor
When you want to control a volume of a stereo, you need an input that gives range of value like volume knob. When you want to turn on/off the stereo, you need an input device that gives two state, like switches. Let’s say that we call the range of value as analog value and input devices/ sensors that gives the range of value as Analog Sensors, while the two state value will be called as digital value and input devices/ sensors that gives two state value as Digital Sensors.
Even though the sensor gives range of input, you can always use it as two state switch as well by programming threashold. Or you can get a range of input from two state sensors, for example counting how many times a button is pushed.
So, there never be one kind of sensor is better than the other. You just need to find out what kind of input information you need, or how to interpret the information your sensor gives.

Building Textile Sensors: Digital

This week, we will build a digital sensor/ switches. Digital sensors have 2 states, 1(ON) and 0(OFF) while analog sensors have range of states like “half on” between on and off. The idea is simple. You have two conductors (conductive thread, conductive fabric.. or any material that conduct electricity) that has state of touching each other, or not touching each other.

Here is an example of finger switch. Conductors on each fingers are not electrically connected when your fingers are not touching each other, and when you close your fingers they contact and let the electricity go through.

You can think of body parts that you could detect two state: touch/not touch, and make this simple contact switch. It can be a finger tip and a palm to detect if your hand is open or not, or your upper arm and side of your body to detect if your arm is held up or down.

When adding conductive fabric to base fabric, one of the convenient/quick ways is to use fusible interfacing. It is sometimes called bondaweb, iron-on textile glue or vileceline.  You will need an iron (or ideally heat press) to use it. The fusible in the material kit is from a company called Bemis.

If you do not have iron at home, and can not use fusibles, you can also think of other ways to add conductive surfaces on your base fabric. here are some examples. When adding conductive surface, you want to also consider the stretchness of your base material and choose which material and method suits the best.

Now, you can also try making fabric push button. This is a translation of common mechanical push button into soft fabric material. The idea is again the same. two separate conductors that touch when you push. 

Here are more instruction >>  https://www.kobakant.at/DIY/?p=48

You can make the button in any shape. You have to think about where your are pushing it, where the conductors should be placed, and how the spacer separates them to achieve two states. The tabs are made so it is easier to connect crocodile clips. If you are designing for specific embedded application, you may not need these tabs.

You can come up with designs of digital sensor/ switches. Here are some example of digital sensor ideas

 Neoprene Stroke Bracelet  >> detail instructions

 Tilt Sensor  >> detailed instructions

 Button Switch  >> detailed instructions

To read these sensors with Arduino, please go to this post for further instructions    https://www.kobakant.at/DIY/?p=8601 .

Materials: Resistive (not so conductive) textile materials
Eeonyx non woven carbon resistive

Company:  Eeonyx

Characteristics: Resistive material (2k), non woven, can be used to make pressure or bend sensor. 

Eeonyx stretch woven carbon resistive

Company:  Eeonyx

Characteristics: Resistive material (2k), knit/ jersey, Stretch in both direction. Can be used to make pressure or stretch sensor. 

Velostat

Company : 3M

We bought it from lessEMF, but 3M produces it and there are more retailers.
Characteristics: Piezo resistive. Changes its resistance when pressed. Good for pressure sensors.

Bekinox 50/2 conductive yarn

Company:  Bekaert

Characteristics: Nm50 2ply conductive yarn, 80% polyester 20% stainless steel, light grey

Bekinox W12/18 conductive wool

Company:  Bekaert

Characteristics: Conductive wool is perfect for felting. It is very fine conductive fibers (steel) mixed with normal wool

Building Textile Sensors: Analog

Now we try analog sensor. Analog sensors shows range of inputs, like faders or volume knobs on your audio devices. It has range of states. The introduced textile sensors change its electrical resistance. Instead of ON (no resistance) or OFF (infinitely big resistance) it has the range in between the two.

If you remember the materials we sampled in week2, there were some highly resistive materials that had resistance changing properties. We use these properties to build a sensor. The challenge is to design a surface or an object that accommodate the resistance change when you interact with it. Here are some examples.

Textile Bend Sensor

 detailed tutorial here>>

Knit/Crochet sensor

 detailed tutorial here>>

 example with knitting mills>>

Felt pressure/bend sensor

 how to wet felt>>

 how to wet felt 2>>

 how to needle felt>>

and there are many more nice tutorials on felting techniques online. please check.

here are some sensor design that extends the introduced sensors.

 Sticky tape bend sensor

 Bonded Bend Sensor

 Sheath Bend Sensor

 Crochet/Knit Squeeze Sensors

 

 felted crochet pressure sensor

 Felted Pompom Pressure Sensor

You can try exploring these other sensor designs, or make your own sensor design.

to connect Analog sensors, you will need to build voltage dividers. Details are here with an experiment with a multimeter >>  https://www.kobakant.at/DIY/?p=6102

The code for Arduino and how to connect is explained in this post >>  https://www.kobakant.at/DIY/?p=8601

Here is the breadboard view and code example from the last exercise in the 2nd day of the course.

int val;
int light;
int freq;

void setup() {
  // start serial communication
 Serial.begin(9600);
 // set the pin connected to LED as OUTPUT
 pinMode(5,OUTPUT);
}

void loop() {
  // read analog pin:
  val = analogRead(A0);
  // map the sensor reading to analogWrite range 0-255
  light = map(val, 20,200,0,255);  
  light = constrain(light,0,255);
  analogWrite (5,light);

  // play sound only when you touch (when the value is bigger/smaller than xxx)
  if (val > 280){
  freq = map(val, 20,200,100,2000);
  freq = constrain(freq,100,2000);
  tone(8,freq,50);
  delay(100);
  }
  else{
    // when not touched, turn off the sound
    noTone(8);
  }

  // here is the range fix line for the plotter
  Serial.print(0);
  Serial.print(" ");
  Serial.print(1023);
  Serial.print(" ");
  // print the value reading from the sensor
  Serial.println(val);
  
}
