---
source: How To Get What You Want / KOBAKANT DIY
title: "Making Soft Noise"
url: "https://www.kobakant.at/DIY/?p=8601"
postId: 8601
date: "2021-01-13T22:01:56"
modified: "2021-11-24T14:07:21"
slug: "soft-noise"
imported: "2026-05-16 10:16"
---

<!-- pbs-source:htgwyw -->
#pbs/source/htgwyw

# Making Soft Noise

Source: https://www.kobakant.at/DIY/?p=8601

## Excerpt

In this 2 days online course, we cover the basic introduction of Arduino, how to connect and read e-textile sensors and how we can use them to control sound synthesis with Arduino. Starting to work with Arduino Connect your Arduino with your computer through USB cable. Open your Arduino IDE (download from here), and open […]

## Content

In this 2 days online course, we cover the basic introduction of Arduino, how to connect and read e-textile sensors and how we can use them to control sound synthesis with Arduino.

Starting to work with Arduino

Connect your Arduino with your computer through USB cable. Open your Arduino IDE (download from  here), and open blink example sketch from File/Examples/Basics/Blink. 

 

Now we try to upload this sketch to your Arduino to make sure your computer is communicating with your Arduino, and see if your Arduino is working. From Tools/Board choose Arduino Uno as the board you have are Arduino Uno. In future, if you use other types of Arduino boards, choose the ones accordingly. If you do not see them listed here, you can go to board manager and install the required file from internet.

 

Now from Tools/Port, choose the port your Arduino is connected. 

 

Now press “upload” button, placed on the left top corner. It looks like arrow. When you press, it says on the bottom section “compiling sketch…” “uploading…” and “Done uploading”.  If you see the small LED on the Arduino board blinking, your upload was successful. Your computer is connecting with Arudino.

Now let’s look at the program we uploaded now. 

// the setup function runs once when you press reset or power the board
 void setup() {
   // initialize digital pin LED_BUILTIN as an output.
   pinMode(LED_BUILTIN, OUTPUT);
 }
 // the loop function runs over and over again forever
 void loop() {
   digitalWrite(LED_BUILTIN, HIGH);   // turn the LED on (HIGH is the voltage level)
   delay(1000);                       // wait for a second
   digitalWrite(LED_BUILTIN, LOW);    // turn the LED off by making the voltage LOW
   delay(1000);                       // wait for a second
 }

LED_BUILTIN indicates the pin number of the LED that we are blinking. In the Arduino Uno hardware, it is 13. If you replace all the LED_BUILTIN to 13 in your IDE and upload it again, it should still be blinking the same. Now change the 13 to 12 and upload. What happens? 

void setup() {
   // initialize digital pin LED_BUILTIN as an output.
   pinMode(12, OUTPUT);
 }
 // the loop function runs over and over again forever
 void loop() {
   digitalWrite(12, HIGH);   // turn the LED on (HIGH is the voltage level)
   delay(1000);                       // wait for a second
   digitalWrite(12, LOW);    // turn the LED off by making the voltage LOW
   delay(1000);                       // wait for a second
 }

you do not see the LED blinking anymore. This is because you do not have a LED connected to pin12. If you add LED on pin 12, you will see it blinking. Let's try. Make sure that LEDs have polarity(direction). Longer leg faces plus (pin12) shorter leg faces GND. 

 

Let’s experiment more with the code. 

 pinMode() function indicates if you are using the pins as output (giving out voltage) or input (reading incoming voltage). 

 digitalWrite() function turns the pins on (giving out 5V) and off (giving out 0V).  

 delay() function delay/pose the process for the specified time (miliseconds) 

Now 2 question. 1) How do you blink the LED faster than now? 2) Can you blink both LEDs on pin 12 and 13?

Arduino has Digital pins and Analog pins as indicated in this image. Digital pins works as both input and output, therefor you ened to specify if you are using it as input or output with pinMode() function. Analog pins only work as input, therefor you do not have to specify them, unles you want to use them as additional digital pins (you can also address tehm as digital pin 14-19)

Serial Communication

To monitor what is happening inside the Arduino, we can use serial communication over USB cable to communicate with Arduino. Add  Serial.begin(9600) function specifying the communication speed as 9600 in setup() function. Then add Serial.print(“hello”); in loop() function. Let’s upload.

void setup() {
    pinMode(12, OUTPUT);
    Serial.begin(9600);
  }
  // the loop function runs over and over again forever
  void loop() {
    digitalWrite(12, HIGH);   // turn the LED on (HIGH is the voltage level)
    delay(1000);                       // wait for a second
    digitalWrite(12, LOW);    // turn the LED off by making the voltage LOW
    delay(1000);                       // wait for a second
 Serial.print("hello");
  }

click the serial monitor button on the right top corner (looks like an inspection glass). It opens new window and you see hello printed.

If you change the Serial.print() to Serial.println() what happens?

Can you change the message? Can you print when the LED is on, “On” and when its off “Off”?

Variables

Variables are place holder for numbers, characters, states and sentences. It is like making a storage box with a name label on it. You need to specify the size of the box depending on what kind of content you want to store, and name of the box so you can find where they are.  Let’s create a variables, calculate number and print on serial.

I would like to store a number, so the type can be int (-32,768 to 32,767), and I name the variable as myValue. I declare that I create this variable at the very beginning of the code, before the setup() function. I put initial number as 0.

Then I make a simple calculation, like 1+2. the result of the calculation is stored in myValue. myValue = 1+2; Lets print this to see what happens.

int myValue = 0;
 void setup() {
    pinMode(12, OUTPUT);
    Serial.begin(9600);
  }
  // the loop function runs over and over again forever
  void loop() {
    digitalWrite(12, HIGH);   // turn the LED on (HIGH is the voltage level)
    delay(500);                       // wait for a second
    digitalWrite(12, LOW);    // turn the LED off by making the voltage LOW
    delay(500);                       // wait for a second
    myValue = 1+2;
    Serial.println(myValue);
  }

now you see it printing out the answer 3 every 1 second? But this is a bit boring. Can we create a counter that counts up every time it blinks? 

To do this, you need to refer to the result of the calculation in each iteration of the calculation.  myValue = myValue +1; 

int myValue = 0;
 void setup() {
    pinMode(12, OUTPUT);
    Serial.begin(9600);
  }
  // the loop function runs over and over again forever
  void loop() {
    digitalWrite(12, HIGH);   // turn the LED on (HIGH is the voltage level)
    delay(500);                       // wait for a second
    digitalWrite(12, LOW);    // turn the LED off by making the voltage LOW
    delay(500);                       // wait for a second
    myValue = myValue + 1;
    Serial.println(myValue);
  }

This sounds a bit confusing, but here is how it works. You have stored 0 in the beginning in myValue box. So first time it comes to this line in the loop, it is myValue = 0 +1;  that is 1. now 1 gets stored in myValue and prints out 1 in the next line.

In the next iteration of the loop, when it comes to the line, it again looks into the myValue box, which has now 1 stored. so the calculation is myValue = 1+1; that is 2. now 2 gets stored in myValue and prints out 2 in the next line.

Let’s change the code, upload and open serial monitor. Do you see the Arduino counting up?

Reading sensors

Now let’s try to read the e-textile sensors you made earlier. We made 2 types of sensors, digital sensors and analog sensors. You can read digital sensors (5V/0V) with digital pins that is set the mode as input, and analog sensors (range value between 0-5V) with analog input pins. Arduino’s input pins are reading receiving voltage, so you have to create a small circuit that will provide voltages according to the state of your sensors. 

Digital Read

Let’s start with digital sensors. It is also called contact switch. It makes electrical contacts and let the electricity go through. So, if you connect one end of the sensor to 5V and the other to digital input pin and make the contact, it should lead 5V into the input pin. Let’s try.

 

Then I need to change the code. I connected one side of the button to digital pin3, and I want to use it as input. So I change the pinMode() as pin3 used as INPUT.

inside the loop function, instead of digitalWrite() we use digitalRead() to read the pins. Specify which pin you are reading, and store the result of reading in myValue variable. Then print what it read through serial communication. I leave delay(100); so it prints 10times/second. 

int myValue = 0;
 void setup() {
    pinMode(3, INPUT);
    Serial.begin(9600);
  }
  // the loop function runs over and over again forever
  void loop() {
    myValue = digitalRead(3);    
    Serial.println(myValue);
 delay(100);
  }

Open serial monitor and see if you can read your digital sensor. Does it say 1 when you close the contact and 0 when you open it? 

Perhaps you see some stuttering when it is open. Instead of 0, it goes 0001001010 or it takes time until it turns to 0. This is because your input pin becomes open antenna when your switch is open. To avoid this you need to add  pull-down resister to make sure that the pin is connected to GND when the switch is open and it connects to 5V when the switch is closed. You need to use the resister size 10k ohm or bigger to avoid shortcut between 5V and GND when your switch is closed.

 

Now does it behave exactly how you open and close your switch? 

You can add now LED on the code and control the on/off state of the LED with your switch.

int myValue = 0;
 void setup() {
    pinMode(3, INPUT);
    pinMode(13,OUTPUT);
    Serial.begin(9600);
  }
  // the loop function runs over and over again forever
  void loop() {
    myValue = digitalRead(3);    
    Serial.println(myValue);
    digitalWrite(13,myValue);
 delay(100);
  }

Analog Read

Now let’s try analog sensors.  To read analog sensors, we use analog input pins. Let’s try to switch your sensor from digital one to analog one, and reconnect the reading pin from digital pins to analog input pins.

 

The image still uses knit push button, but please use analog sensor you made instead

now we also need to change the code. as you’ve guessed, we use analogRead() instead of digitalRead(). and specify the pin number you want to read. Let’s upload and open serial monitor.

int myValue = 0;
 void setup() {
    //pinMode(3, INPUT);
    //pinMode(13,OUTPUT);
    Serial.begin(9600);
  }
  // the loop function runs over and over again forever
  void loop() {
    myValue = analogRead(A0);    
    Serial.println(myValue);
    //digitalWrite(13,myValue);
 delay(100);
  }

You see the number printing in the serial monitor window, but it does not move very much.  This is because your circuit is not dividing the voltage that goes into your input pin with your sensor well.

Voltage Divider

You can divide the voltage with 2 resisters. The voltage gets divided according to the ratio between the 2 resisters. Let’s make an experiment.

 

Here, 5V is divided with 2 resisters. both of them are 10k ohm, so ratio 1:1. I connect the middle to A0, which we are reading with the current code on Arduino. What do you see in serial monitor?

 

Now I change right side resister to 1k ohm. the ratio between the two resisters are 10:1. Now what is your analog pin reading?

 

Now I change the right side resister to 47K ohm. Ratio between the two is 1:4,7  What does your analog pin reads?

Notice when the resistance of right side resister change, the ratio between the two resister change and resulting in the change in incoming voltage at the reading point. As your analog sensor also changes the resistance as you manipulate, it works similar to this right side resister. You just need to use a resister on the left that works with your sensor’s resistance range. For example, if your sensor range is 100 ohm to 600 ohm and you had 10k ohm fix resister, then the ratio goes from 1:100 to 6:100. That is not a big change. If you changed your resister to 100 ohm, the ratio change now goes from 1:1 to 6:1. This will result in bigger reading range.

 

Serial Plotter

You can use the plotter (graph) tool of Arduino IDE to monitor your sensor behavior better. Add these two lines before Serial.println() to fix the plotting range and reduce the delay length to plot faster.

int myValue = 0;
 void setup() {
    //pinMode(13,OUTPUT);
    Serial.begin(9600);
  }
  // the loop function runs over and over again forever
  void loop() {
    myValue = analogRead(A0); 
    Serial.print(0); 
    Serial.print(" "); 
    Serial.print(1023); 
    Serial.print(" ");   
    Serial.println(myValue);
    //digitalWrite(13,myValue);
 delay(10);
  }

Open plotter from Tools/Serial Plotter. It opens a new window and graphs what your are printing out.

Blinking-Oscillation-Speaker

Let’s save the sketch we were working on and close. 

Now, I want to introduce to use speaker. Inside of the speaker is a permanent and an electrical magnet /coil. When you apply electricity, the coil becomes a magnet, repelling (or attracting) to permanent magnet and move the membrane attached to it. When you turn off the electricity it stops repelling as it is not a magnet anymore. The membrane pushes it back to the original position. By quickly switching the electricity on and off, it causes the membrane of the speaker to oscillate, pushes the air. We hear this movements of the air as sound. The more often you switch it, the higher the frequency is and the higher it sounds.

Let’s experiment. You have a speaker in your kit. Connect one end to digital pin 8, the other to GND. Speakers does not have polarity so you can use either end as GND. 

Let’s go back to the blink sketch. Change the pin you are controlling from 13 to 8. Try to turn on/off in different speed by changing the delay amount. Does it make sound? If you change the delay amount how does it affect?

void setup() {
   // initialize digital pin LED_BUILTIN as an output.
   pinMode(8, OUTPUT);
 }
 // the loop function runs over and over again forever
 void loop() {
   digitalWrite(8, HIGH);   // turn the LED on (HIGH is the voltage level)
   delay(2);                       // wait for a second
   digitalWrite(8, LOW);    // turn the LED off by making the voltage LOW
   delay(2);                       // wait for a second
 }

Instead of manually controlling the on/off of the pin, there is a function with which you can specify the frequency of the tone. it is called  tone() function.  The second argument states the frequency of the tone.

 void setup() {
 }
 
 void loop() {
   tone(8, 800);
 }

Trigger note: keyboard

Now we can bring back the digital sensor/switch and make a simple keyboard. When you press your switch, it plays one tone. Imagine if you had many switch, you can play it like piano.

 

int buttonValue=0;
 // the setup function runs once when you press reset or power the board
 void setup() {
   pinMode(3,INPUT);
 }
 // the loop function runs over and over again forever
 void loop() {
   buttonValue = digitalRead(3);
   if (buttonValue == 1){
   tone(8, 800);
   }
   else{
     noTone(8);
   }
 }

you can make it to play a melody when you press your switch.

int buttonValue=0;
  // the setup function runs once when you press reset or power the board
  void setup() {
    pinMode(3,INPUT);
  }
  // the loop function runs over and over again forever
  void loop() {
    buttonValue = digitalRead(3);
    if (buttonValue == 1){
    tone(8, 262); //C4
    delay (100);
    tone(8, 196); //G3
    delay (200);
    tone(8, 220); //A3
    delay (100);
    tone(8, 157); //B3
    delay (100);
    noTone(8);
    delay (100);
    }
    else{
      noTone(8);
    }
  }

If you have 2 or more buttons…

 

int buttonValue1=0;
 int buttonValue2=0;
 // the setup function runs once when you press reset or power the board
 void setup() {
   pinMode(3,INPUT);
   pinMode(4,INPUT);
 }
 // the loop function runs over and over again forever
 void loop() {
   buttonValue1 = digitalRead(3);
   buttonValue2 = digitalRead(4);
   if (buttonValue1 == 1){
   tone(8, 400);
   }
   else if (buttonValue2 == 1){
   tone(8, 800);
   }
   else{
     noTone(8);
   }
 }

Pitch Follower: Theremin

As analog sensors has range we can control the frequency of the playing back tone with analog sensor. This will create Theremin like instrument.

 

We create a new variable called sensorValue (or any name you like), and read A0 pin and store the value in sensorValue. let’s try to play back the value as frequency. How does it sound? Additionally we print the variable so we can see what range Arduino is reading.

int sensorValue=0;
 // the setup function runs once when you press reset or power the board
 void setup() {
   Serial.begin(9600);
 }
 // the loop function runs over and over again forever
 void loop() {
   sensorValue = analogRead(A0);
   tone(8, sensorValue);
 Serial.println(sensorValue);
 }

It is ok, but it will be great if it could control wider range of frequency. We could calculate range of frequency we want to control from the sensor reading value.  map() function maps original range to new scale of range. For example, my sensor reads from 550 (fromLow) to 780(fromHigh), and I want it to scale to 140 (toLow) to 2000(toHigh). Now the playing back tone frequency is scaled to 140-2000. I have also added print for sensor value and calculated pitch. You can see how these two numbers move in serial monitor.

int sensorValue=0;
 int myPitch=0;
 // the setup function runs once when you press reset or power the board
 void setup() {
   Serial.begin(9600);
 }
 // the loop function runs over and over again forever
 void loop() {
   sensorValue = analogRead(A0);
   myPitch = map(sensorValue, 550, 780, 140, 2000);
   tone(8, myPitch);
 Serial.print(sensorValue);
 Serial.print(" : ");
 Serial.println(myPitch);
 delay(10);
 }

Note that with map function, when the sensor reading is below 550 or over 780, it returns value less than 140 or over 2000. If you want to limit the frequency exactly between 140-2000, you can limit it by using  constrain() function after calculating the pitch. This way, if it goes under 140, it retruns 140 and if it goes over 2000 it returns 2000.

myPitch = constrain(myPitch, 140, 2000);

you can experiment with different pitch range, adding duration and delay and see what kind of sound effect you can get.

Sound quality

You may think that the sound you get is not as nice as sound you hear from computer when you play back mp3 or even toy pianos you can buy. This is because at the moment we are playing single square waveform. See this article about different types of waveforms >>  http://synthesizeracademy.com/waveforms/

The music files we play back on computers have much more complicated waveform that makes the rich sound. To play back more complicated waveform on Arduino is possible, but could be tricky. One way to do it is by using  Mozzi library. This could be your next step if you want to build good sounding synthesizer with your soft interface.

Mini Project Challenge

Using the technique you  learned, please design a soft synthesizer that is played in unusual ways. You can think of how it is played/body interaction, how does it feel to play/ haptic interface/surface structure, and how does it sound as an experience as a whole. You have one day to prototype. Think of the way you can prototype a proof of concept with the material and time you have.
