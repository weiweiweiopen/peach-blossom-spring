---
source: How To Get What You Want / KOBAKANT DIY
title: "Weigh, Measure, Count"
url: "https://www.kobakant.at/DIY/?p=8833"
postId: 8833
date: "2021-04-21T10:53:11"
modified: "2021-04-27T17:35:23"
slug: "wei"
imported: "2026-05-16 10:16"
---

<!-- pbs-source:htgwyw -->
#pbs/source/htgwyw

# Weigh, Measure, Count

Source: https://www.kobakant.at/DIY/?p=8833

## Excerpt

This workshop is held as a part of the semester project course “Weigh/Measure/Count” at the Weissensee Art Academy Berlin during the Summer Semester 2021. You can use electrical sensors to measure, count and weigh objects or environment. These sensors often use unique properties of materials, that changes its electrical property like resistance, capacitance, luminescence.. when […]

## Content

This workshop is held as a part of the semester project course “Weigh/Measure/Count” at the Weissensee Art Academy Berlin during the Summer Semester 2021. 

You can use electrical sensors to measure, count and weigh objects or environment. These sensors often use unique properties of materials, that changes its electrical property like resistance, capacitance, luminescence.. when it is exposed to certain condition, like pressure, temperature.. to sense what is happening in the surroundings.

We tend to think electrical sensors to be providing objective measurment of things. But the measurment we see in commercial measurement devices (i.e. kitchen scale) is a result of callibrating the change of electrical property with the unit we compare. If the mapping of the electrical reading and the unit is changes, we will observe a skewed measurment result. The design of the tool also plays a role in the objectiveness of the measurment. How it is placed, attached, and which unit is used changes our perception of the object and its measurement. Jenifer Gabrys looks into Citizen-sensing tool kits, instructions and participation to study how making your own sensors and act of sensing empowers you to construct social–political worlds in her book  “ How to Do Things with Sensors” (I can recommend to read it!)  

“Many theorists have discussed the ways in which instruments generate more-than-descriptive engagements that enact worlds. In other words, instruments are world-making. They are constructive and performative of the worlds that they would detect, measure, and act upon. But the imperative mood designates explicit actions along with observations that might be achieved. It constitutes the methods by which such constructions and performativity take place, or falter.” ( How to Do Things with Sensors)

Day 1

Making your own analog/digital sensor 

When you look at various types of electrically operating sensors, there are two types of sensors. Digital sensors that has two discrete state of ON (1) /OFF (0) , and analog sensors that has range of readings.

In this workshop, we start by building our own DIY sensors. A contact switch as a digital sensor example and pressure sensor as an analog sensor example. This way you can see the construction inside, mechanism of how electricity flows and how it senses the world.

Aluminum foil Contact Switch

This sensor is made of simply two pieces of aluminum foil (conductor) contacting when you press down the two contacts together.

See the detailed construction post here >> https://www.kobakant.at/DIY/?p=8906

   
   

Aluminum foil + Velostat Pressure sensor

Velostat (anti-static foil, ESD foil) is a carbon-impregnated polyolefin foil, that is piezoresistive. As it contains a lot of carbon particle, it is conductive but highly resistive. When the material is pressured, the carbon particle inside gets closer and resistance gets lower. 

See the detailed construction post here >>  https://www.kobakant.at/DIY/?p=8936

    

Insert this material between two aluminum foil conductor of the switch you made earlier. You’ve made a pressure sensor now! When you press the two conductor through the velostat together, it senses the pressure you apply, by changing its resistance accordingly. Here is the resistance measurement with a multimeter.

  

Multimeter

Multimeter is a measurement tool for electricity. It measures Voltage (potential), Ampere (current) and Ohm (resistance). Ohm’s law describes the relationship between the 3 property as:

V (voltage) = I (current)  x R (resistance)
I (current) = V (voltage) / R (resistance)

 

When you work at the eLAB, you can borrow a multimeter and measure your sensors or circuits. Here is a detailed description of how to use Multimeter from sparkfun
 https://learn.sparkfun.com/tutorials/how-to-use-a-multimeter/all

The pressure sensor I made with a velostat sheet measures ~12,000 ohm when I lightly touch it and goes down to 400 ohm when I press it strongly.

 

Since you do not have a multimeter with you at home, you can make a simple LED circuit with Arduino Uno to test the sensors you’ve build. Make the following connection with jumper cables, crocodile clips and a LED. LED has direction (polarity). Electricity flows from Longer leg to shorter leg: Shorter leg should connect the GND.

 

Now connect you sensor between red cable (crocodile clip) and yellow cable (crocodile clip) and see how your LED behaves. Make sure to connect the USB cable to your computer so your Arduino is powered.

 

analogRead()

Arduino’s microcontrollers pins has ADC (analog to digital converter) capacity. It can read the analog signal (voltage) to digital data, or it can write the digital data to analog signal (voltage). To read sensors, we use this capacity to read the electrical property change of the sensors. 

To experiment with the ADC, let’s upload analogReadSerial example to your Arduino from Arduino IDE File/examples/01.Basics/AnalogReadSerial

// the setup routine runs once when you press reset:
void setup() {
  // initialize serial communication at 9600 bits per second:
  Serial.begin(9600);
}

// the loop routine runs over and over again forever:
void loop() {
  // read the input on analog pin 0:
  int sensorValue = analogRead(A0);
  // print out the value you read:
  Serial.println(sensorValue);
  delay(1);        // delay in between reads for stability
}

now let’s look into this code and see what it does. 

In the setup() function, it states  Serial.begin(9600); this initializes the communication between your computer and Arduino over USB cable (serial) and decide on the communication speed of 9600 baudrate.

In the loop() function, it reads A0 pin  analogRead(A0); and stores it in new variable called “sensorValue”

Then it prints to serial what is in the “sensorValue” variable Serial.println(sensorValue);

Let’s upload this sketch to your Aruino and see what A0 is reading.

Open serial monitor from right top corner. Click the icon that looks like inspection glass and it opens a new window. Alternatively you can open from the menu bar Tools/Serial Monitor.

You will now see a lot of random numbers. This is because your A0 pin is not connected to anything and it is reading environmental noise at the moment.

Use jumper cable and connect 0V (GND) or  5V pin to the A0 pin. What happens?  You will probably see in your serial monitor “0” when you connect GND and 1023 when you connect 5V. Arduino Uno’s analog input pins reads the range of 0-5V, and what you see here is the min-max range of the AnalogRead() function. 

–  bit and byte, binary system- why range is 0 to 1023?
–  what is variables?

challenge: Now it is your turn. Upload analogReadSerial example sketch to your Arduino, open your serial monitor. connect GND/5V. Do you see min-max of analogRead()? Try connecting 3.3V – what do you read? 

Voltage divider experiment

The Arduino’s pins are reading voltage, and not resistance. The pressure sensor we made change resistance, but it does not provide voltage on its own. so what we need to do is to create a small circuit that gives out different voltage when you change resistance. 

When you connect two resisters in series, and provide voltage across these 2 resisters, voltage gets divided between the two resisters in the ratio between the two resisters.

 

We can try making this experiment with your Arduino. Let’s try to build voltage divider with 2 same size resister (10k) on your breadboard.

 

What do you see in your serial monitor?

Now change one of the resister to 1k. Do you see changes in the reading?
the ratio between 2 resisters are 10k : 1k = 10:1

Now change it to 100k. what do you read now?
the ratio between 2 resisters are now 10k : 100k = 1:10

BTW: holes of breadboard is internally connected in this way

Connecting your analog sensor as a part of voltage divider

Your pressure sensor changes resistance (i.e. 400 ohm – 12000 ohm) instead of manually changing the 2nd resister, lets try using  analog sensor as the second resister. Extend where your 2nd resister is connected with jumper cables and connect your pressure sensor in place with crocodile clips.

Open your serial monitor and see what AnalogRead() is reading. When you pressure your sensor, does it change? 

**If your reading range is very small (it moves only small range when you pressure) then maybe your pull up/down resister size does not compensate with your sensor’s resistance. Try changing your pull-up/down resister’s size and see if your reading range gets bigger 

It is a bit hard to see how your sensor reading changes over time when you are looking at the printed out numbers on serial monitor. You can use serial plotter tool of Arudino. Close your Serial Monitor, then open Serial Plotter from Tools/ Seiral Plotter. It will open a graph like window and you will see what Serial.println sends as a line on a graph.

With the Serial Plotter, there is one problem. It has auto range function and it keeps changing the range you view… that is a bit annoying.

You can add the following line before the Serial.println() on your code to draw lines on 0 and 1023 to fix the range.

Serial.print(0);
Serial.print(",");
Serial.print(1023);
Serial.print(",");

challenge: connect your sensor, check with serial monitor (note down your sensor range min/max), add 4 lines on code and monitor with serial plotter 

digitalRead()

what happens when you connect digital sensor now? Try connecting your contact switch and see what you read on serial monitor.

 You will probably see only 0 or 1023, no numbers in between. This is because digital sensors has only two states, ON or OFF

Instead of reading it with Analog Input pins with AnalogRead() you can use a digital pin with digitalRead().  Digital input pins reads voltages as well, but it can tell only if it is ON (5V) or OFF (0V). This will be enough for the digital sensors we have. Let’s move the jumper cable to D3 pin. 

Now, we have to tell Arduino to read D3 pin instead of A0 pin. We are also reading it with  digitalRead() function. The digital Pins can operate both as INPUT pins and OUTPUT pins. So, in the setup() function you need to tell the Arduino if you are useing the pin as INPUT or OUTPUT. This is done by  pinMode() function. see the below modified code.

You can store the value you read in “ int” type variable, but it is a very big container (-32,768 to 32,767, 16bit) for storing just 0 or 1. In this case you can change the type of variable to “ boolean” that is just 1 bit that stores 1 or 0. 

// the setup routine runs once when you press reset:
void setup() {
  // initialize serial communication at 9600 bits per second:
  Serial.begin(9600);
  pinMode(3,INPUT); // digital pin D3 is used as an input
}

// the loop routine runs over and over again forever:
void loop() { 
  boolean sensorValue = digitalRead(3); // read D3 as ditigal 0/1
  // print out the value you read:
  Serial.println(sensorValue); 
  delay(1);        // delay in between reads for stability
}

Now open serial monitor and check how the value changes between 0 and 1

challenge: change code, change connection and see if it works for you

Servo motor 

We would like to use a mini  Servo Motor as a display for our small prototype. You can drive the arm angle of the servo motor by sending a signal to one of the pins. 

Add servo motor to your circuit. Black cable to GND, red cable to 5V, and yellow cable to D9 to control from Arudino. You should have your contact switch still connected to D3.

To drive the Servo motor, you can use  servo library. In the code, you need to add the library by choosing from the menu bar Sketch/include Library/Servo. This will add “#include <Servo.h>” on your sketch automatically. 

before the setup() function, you need to declare a new servo object and you need to give a name to your servo. Let’s call this servo as myservo

Servo myservo;

In the setup() you need to add the line “ myservo.attach(9);”. This will address to your Arduino that you have connected servo motor called myservo to pin D9 and you are controlling it from D9.

In the loop() you can then set the movement of the servo by using  myservo.write(angle). This servo motor’s arm moves from angle 0 to 180. Let’s try adding these lines into the code we were working on.

#include <Servo.h> // include servo library
Servo myservo; //create servo object called myservo

// the setup routine runs once when you press reset:
void setup() {
  // initialize serial communication at 9600 bits per second:
  Serial.begin(9600);
  pinMode(3,INPUT);
  myservo.attach(9); // attache D9 to myservo
}

// the loop routine runs over and over again forever:
void loop() {
  myservo.write(0); // set the myservo's arm to angle 0
  // read the input on analog pin 0:
  boolean sensorValue = digitalRead(3);
  // print out the value you read:
  Serial.println(sensorValue);
  delay(1);        // delay in between reads for stability
}

When you upload the above sketch the arm of your servo motor moves to angle 0 point. If you now change the angle to 90 or 180 or any number between 0 – 180 your servo motor’s arm angle should change. 

Challenge: Connect the servo motor to your circuit, include library and try modifying the code. Can you control the arm angle?

if()

Now you can use your digital sensor to trigger servo. For example, when your contact switch is ON, then the servo goes to angle 180, if not it goes back to angle 0 

// the loop routine runs over and over again forever:
void loop() {  
  // read the input on analog pin 0:
  boolean sensorValue = digitalRead(3);

  if (sensorValue==1){
    myservo.write(180);
  }
  else{
    myservo.write(0);
  }
 
  // print out the value you read:
  Serial.println(sensorValue);
  delay(1);        // delay in between reads for stability
}

How a “ if” statements works?
if (condition written in here is true){ do what is written here; }
else { do what is written here; }
you can express the condition with Comparison Operators

x == y (x is equal to y)
x != y (x is not equal to y)
x < y (x is less than y) x > y (x is greater than y)
x <= y (x is less than or equal to y) x >= y (x is greater than or equal to y)

challenge: Try it yourself .

map() and constrain()

Now let’s connect an analog sensor back to your circuit. Now your reading pin will be A0 instead of D3. Make sure your voltage divider resister size suits with your analog sensor. 

change the code from digitalRead() to analogRead(), and the variable you store the reading data is “int” instead of “boolean” as now it will exceed 0 and 1. Upload the sketch.

Open the serial monitor and note the range you read. What is min? max?

The AnalogRead() range is 0-1023, and your sensor only moves a part of it. For example mine reads from 260 to 650. The servo’s angle range is 0-180. 

or better, you can see this  visualization of how map function behaves.. made by Felix Groll

You can use  map()  function to map/scale the number range. In this example’s case, fromLow is 260 (original range min) and fromHigh is 650 (original range max) that is mapped to toLow 0  and toHigh 180. You can create a new int variable to store the outcome from the map() function.

int mappedValue = map(sensorValue, 260, 650, 0, 180);

Sometimes your sensorValue can still go smaller than 260 or bigger than 650 as you may particularly press it harder than usual, or it is resting in slightly different way. In this case the outcome from the map() could go out of the range of 0-180. This will be a problem for servo as it can only move between 0-180 angle. 

To make sure the angle you write to servo stays in the range, you can use  constrain() function. Make a new variable servoAngle to store the outcome of the function and constrain the mappedValue to the range of 0 to 180

int servoAngle = constrain (mappedValue, 0, 180);

now finally you can write the value stored in servoAngle variable to your servo. The whole loop() of the sketch will look like this

void loop() {  
  // read the input on analog pin 0:
  int sensorValue = analogRead(A0);

  int mappedValue = map(sensorValue, 260, 650, 0, 180);
  
  int servoAngle = constrain (mappedValue, 0, 180);

  myservo.write(servoAngle);
  
  // print out the value you read:
  Serial.println(sensorValue);
  delay(1);        // delay in between reads for stability
}

challenge: Try reconnecting your pressure sensor, change code and see if you can control the servo motor with your sensor.

Day 2

homework: You will find one Seedstudio Grove sensor in your kit. Try find out how to read them, implement and document. Please post your document on the incom page, under “projects”

Day3

Load cell 

A load cell is a force transducer. It converts a force such as tension, compression, pressure, or torque into an electrical signal that can be measured and standardized. ( wikipedia)

There are many tutorials on how to use them… here is one that has very nice detailed explanation and step by step tutorial on how to use them.

 How to Use Load Cell with HX711 and Arduino

One thing you have to take care is to mount load call on your work space so you can weigh. Here are some examples of how you can fix it without making special mount for it.
