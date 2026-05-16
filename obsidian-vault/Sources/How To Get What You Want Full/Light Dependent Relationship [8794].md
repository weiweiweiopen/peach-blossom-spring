---
source: How To Get What You Want / KOBAKANT DIY
title: "Light Dependent Relationship"
url: "https://www.kobakant.at/DIY/?p=8794"
postId: 8794
date: "2021-03-30T12:56:11"
modified: "2021-03-30T18:11:02"
slug: "light-dependent-relationship"
imported: "2026-05-16 10:16"
---

<!-- pbs-source:htgwyw -->
#pbs/source/htgwyw

# Light Dependent Relationship

Source: https://www.kobakant.at/DIY/?p=8794

## Excerpt

This workshop is a part of a course UltraTools at the Product Design department of the Weissensee Art Academy Berlin, held on April 19th and 21st 2021. Designing Interaction How you interact with an object/ device and how it responds to you is a big part of how you perceive the object. For example: If […]

## Content

This workshop is a part of a course UltraTools at the Product Design department of the Weissensee Art Academy Berlin, held on April 19th and 21st 2021.

 

Designing Interaction

How you interact with an object/ device and how it responds to you is a big part of how you perceive the object. For example: If you gently swipe a lamp and the light slowly fades in, or hitting your lamp with your fist and it abruptly turning on brightly gives you a complete different impression of the object. You can use this as design language to provoke an experience you intend for a person using the device. 

Challenge1:
Think of 10 interaction how you would turn on/off a light (you can specify the size of the lamp) and list on your note.

Challenge2:
Pick 3 and act out. Record your action as movies.

Challenge3:
With these interaction, how does the light turn on/off? Straight on, fading, flashing…  Note it down.

Introduction to Prototyping Tools

Prototyping your interaction design idea and testing physically how it feels is a good way to verify and iterate your idea in design process. To do this in quick succession, There are many prototyping tools available. Arduino ( https://www.arduino.cc/) is an open source microcontroller development board that allows you to prototype electronics projects. 

It has Digital output pins (controls if 0V or 5V goes out from the pin), Digital input pins (reads if 0V or 5V is coming into the pins) , Analog input pins (reads range of 0V~5V coming into the pins). You can program the  microcontroller on the board to design the behavior of the board. For example, you can program it to read how much voltage is coming into one pin, and decide the behavior of the other pin whether it gives out 0V or 5V. If you connected a push button on the pin you are reading, and LED on the pin you are controlling, it controls the light of the LED with the push button.

To do:
 – Download Arduino IDE from  https://www.arduino.cc/en/software
after downloading, make sure to move it to your application folder (do not leave it in your download folder)
– Connect your Arduino with USB cable to your computer
– Open Arduino IDE and see if your computer recognizes Arduino. 

From Tools/Port, choose the port your Arduino is connected.

 

From Tools/Board choose Arduino Uno as the board you have are Arduino Uno. 

 

Open blink example sketch from File/Examples/Basics/Blink.

 

Now you try to upload this sketch to your Arduino to make sure your computer is communicating with your Arduino. See if your Arduino is blinking.

Challenge 1:
Try to change the speed of blinking by changing the code. Do you find which part of the code is controlling the speed of blinking? What is this example “Blink” program doing?

Breadboard is a useful prototyping tool to connect wires and components with microcontroller boards. the holes you see on the surface of the board is connected as seen above inside.

Challenge 2:
Let’s add extra LED on pin 11. How do you connect with pins using breadboard?

Tip: LEDs have directions >>  https://en.wikipedia.org/wiki/Light-emitting_diode

 

To be correct, it is recommendable to add current limiting resister as LEDs you have needs only 20mA with 2.2V while the Arduino’s pins are giving out 5V. You can add 150 ohm register.  More about current limiting resister here

 

Now you will need to change your code to control pin11 instead of LED_BUILTIN. If you type in 11 instead of LED_BUILTIN, it will start to blink the extra LED you have just added. Now let’s add one more LED on the pin10. Modify the code so both of the LED blinks. 

LDR: Light Dependent Resister

Now let’s try to add a sensor to our circuit.  LDR (Light Dependent Resister) or Photoresister is a sensor that decreases resistance with respect to receiving luminosity (light) on the component’s sensitive surface.

The analog input pins on Arduino reads voltage between 0V-5V. It does not read resistance. (see the relation between voltage, current and resistance on  ohm’s law post)

You will need to create a small circuit that differ voltage that goes into the Analog input pin when the resistance of your LDR changes. This circuit is called  voltage divider. 

we make a small experiment with your Arduino. The Voltage Divider divides the voltage according to the ratio of the two resisters. When you use two of the same resister, the ratio is 1:1 so it should divide the voltage in half.

 

Let’s upload AnalogReadSerial example sketch from examples to Arduino Uno, open Serial Monitor (tools/Serial monitor) and see what your A0 pin is reading. The range of your analogRead is 0 (0V) – 1023 (5V). If you see something around 516, they it is reading 2.5V.

 

Now if you change one of them to another value, you are changing the ratio between the two resister. Do you see the change in reading value?

Now if you replace one of the resister with your LDR, what happens? 

 

If you do not see a big change in your analog reading value, try changing the resister size. Your LDR maybe ranging in different resistance range (for example my LDR changes 2k ohm – 15 k ohm, so 10k ohm resister to divide voltage works well). Also, check your lighting environment. Is light condition changing enough for LDR to react?

Quick Prototyping

You can see if the LDR captures your gesture/interaction by taping LDR on various position of your body and how the reading reacts to it. The LDR is reacting to the light, but as you can change the light condition with your posture, you can use it to detect your posture/interaction.

 

You can modify your AnalogReadSerial sketch to fix the range (see below code example) and monitor your reading from Tools/Serial Plotter. Plotter draws graph with the value receiving from the serial communication. This may make it easier to examine if the LDR is reacting to the interaction you want to capture.

void setup() {
  // initialize serial communication at 9600 bits per second:
  Serial.begin(9600);
}

// the loop routine runs over and over again forever:
void loop() {
  // read the input on analog pin 0:
  int sensorValue = analogRead(A0);
  // print out the value you read:
  // -- draw two lines, one on 0 and the other on 1023
  Serial.print(0);
  Serial.print(",");
  Serial.print(1023);
  Serial.print(",");
  // ---- until here fix the range on plotter
  Serial.println(sensorValue);
  delay(1);        // delay in between reads for stability
}

Challenge:
Try to capture 3 gestures you have chosen earlier with Arduino using LDR. What is a good positioning of the sensor? By just looking at the Serial Plotter, can you tell how you are behaving?

Adding Light Behavior

We  can use the readings from the sensor to control the behavior of the LED light. (example below uses LED on pin11)

For example, you can switch on the light when you are on certain posture. 

void setup() {
  // initialize serial communication at 9600 bits per second:
  Serial.begin(9600);
  // set digital pin 11 as OUTPUT pin
  pinMode(11, OUTPUT);
}
void loop() {
  // read the input on analog pin 0:
  int sensorValue = analogRead(A0);

  if (sensorValue > 500){
    digitalWrite(11,HIGH);
  }
  else {
    digitalWrite(11,LOW);
  }
  // print out the value you read:
  Serial.print(1023);
  Serial.print(" ");
  Serial.print(0);
  Serial.print(" ");
  Serial.println(sensorValue);
  delay(10);        
}

Or change the on/off state every time you come to the posture.

bool state = LOW;
bool trigger;
bool lastTrigger;

void setup() {
  // initialize serial communication at 9600 bits per second:
  Serial.begin(9600);
  // set digital pin 11 as OUTPUT pin
  pinMode(11, OUTPUT);
}

void loop() {
  // read the input on analog pin 0:
  int sensorValue = analogRead(A0);

  if (sensorValue > 500){
    trigger = true;  }
  else {
    trigger = false; }

 if (trigger != lastTrigger){
  if (trigger == true){
    state =! state; // swap the state
    digitalWrite(11, state);   
  }
 }
 lastTrigger = trigger;
  
  // print out the value you read:
  Serial.print(1023);
  Serial.print(" ");
  Serial.print(0);
  Serial.print(" ");
  Serial.println(sensorValue);
  delay(10);        // delay in between reads for stability
}

Or the movement fades in/out the light. 

For fading, we use  analogWrite() instead of digitalWrite(). Arduino’s microcontrollers pins can not actuate 2.2V or 3.6V (only 0V or 5V), but instead it pulsate the 5V to mimic analog value. this is called  PWM. Note that only specific pins are able to do PWM. The PWM pins are marked with ~ next to the pin numbers. The amount you actuate the pins are specified in the range of 0-255. 

Your analog sensor reading range is 0-1023 and it does not show the full range with LDR (for example, mine is reading from 400 to 650). We can use the  map() function to map/scale the range of sensor reading value to 0-255: the range we need for analogWrite().

after going through the map() function, you can add  constrain() function to make sure that the number does not go out of the range of 0-255

example code is below. You will need to adjust the max and min to your reading range.

int sensorValueMin = 400;
int sensorValueMax = 650;

void setup() {
  // initialize serial communication at 9600 bits per second:
  Serial.begin(9600);
  // set digital pin 11 as OUTPUT pin
  pinMode(11, OUTPUT);
}

void loop() {
  // read the input on analog pin 0:
  int sensorValue = analogRead(A0);

  // map the sensorValue to the LED fade range 0-255
  int light = map(sensorValue, sensorValueMin, sensorValueMax, 0, 225);
  // constrain to make sure the light stays between 0-255
  light = constrain(light, 0, 255);

  //analogWrite let you control the intensity of the LED
  analogWrite(11, light);

  // print out the value you read:
  Serial.print(1023);
  Serial.print(" ");
  Serial.print(0);
  Serial.print(" ");
  Serial.print(sensorValue);
  Serial.println();
  delay(10);        // delay in between reads for stability
}

Notice even with the same gesture/interaction, how you assign the light behavior changes the impression of the design. It even changes how I move. 

Challenge:
Choose one of the gesture you have tried earlier. Think about how the movement turns on/off the light. Program the Arduino and try how it feels to interact with the light with the chosen gesture. Is this interaction giving you the impression you have intended? If you change the light behavior, does it change the experience?

Assignment:

Think of a paired words that provoke opposite meaning such as “fast/slow”, “high/low”, “soft/hard” … Design two interaction scheme with light/LED that corresponds to the words you have picked. Pay attention designing how a user move/ interact, and how the light behaves.  Build a prototype with Arduino, LDR and LED to test your design idea. Take a good video of the prototype with you interacting with it.  Does it provoke the feeling of the word you’ve picked? 

Submit the videos by the next course meeting.
