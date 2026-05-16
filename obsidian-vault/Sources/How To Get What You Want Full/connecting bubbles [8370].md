---
source: How To Get What You Want / KOBAKANT DIY
title: "connecting bubbles"
url: "https://www.kobakant.at/DIY/?p=8370"
postId: 8370
date: "2020-06-09T16:23:28"
modified: "2020-07-02T18:53:12"
slug: "connecting-bubbles"
imported: "2026-05-16 10:16"
---

<!-- pbs-source:htgwyw -->
#pbs/source/htgwyw

# connecting bubbles

Source: https://www.kobakant.at/DIY/?p=8370

## Excerpt

This semester, we are sitting in a strange bubble at home. No casual coffee with your friend between the lectures, no physical exchange of cool weaving trick to speed up your assignment, no  hugging, no kissing… Instead of crying over all the things we lack, we can try to use the situation positively, as a unique experience of being isolated, connected only (or mostly) via internet with your friends and colleagues, but somehow share the experience together. Perhaps this is a chance to think about how we can design such an online, remote, yet connected experience. This is my proposal for this semester.

## Content

This is the second part of the soft interactive technology course at the Art Academy Weissensee Berlin. May7 – July 9 2020

This semester, we are sitting in a strange bubble at home. No casual coffee with your friend between the lectures, no physical exchange of cool weaving trick to speed up your assignment, no  hugging, no kissing… Instead of crying over all the things we lack, we can try to use the situation positively, as a unique experience of being isolated, connected only (or mostly) via internet with your friends and colleagues, but somehow share the experience together. Perhaps this is a chance to think about how we can design such an online, remote, yet connected experience. This is my proposal for this semester.

In this second part of the course, we use Particle Photon ( https://docs.particle.io/datasheets/wi-fi/photon-datasheet/) instead of Arduino boards in the usual semesters. Particle devices are equipped with IoT functions and tools such as on board WiFi and cloud services and libraries… Of course you can use other WiFi boards (i.e.  NodeMCU,  Feather…) but as this course is also an introduction course, I chose Photon as necessary tools are already prepared by Particle. 

The first week was about creating your account at Particle and claiming your Photon as your device. We basically followed the tutorial provided by the Particle. In case you’ve missed it, here is the link and the video.

 https://docs.particle.io/quickstart/photon/

June 11: Blink with photon

This week, we turn on/off the LED using “Blink and LED” example code, modify this code to get your own LED animation, read your digital button/switch, control your LED with your button… and finally control other people’s LED with your button.

First open the web IDE and log-in to your account  http://build.particle.io

click the <> CODE tab, there are some example apps listed in your code list. let’s open “Blink an LED” example code.

add LED to D0 as this example uses D7 (onboard LED) and D0. 
try to change the timing of the blinking. Can you alternate 2 LEDs? try different blinking sequences.
add even more LEDs. create new variable for LED pins, declare its pinmode and control (digitalWrite) its status.

When you are done with LED animations, we move on to the next task: reading digital sensor/ switch. The photon’s (and also Arduino’s) digital pins can be used as INPUT or OUTPUT. When used as INPUT, it reads voltages, either HIGH (3.3v in photon, 5v in Arduio uno) or LOW (0V).  So, how should we connect our buttons? Here is a diagram to think about what we can do.

on the breadboard, physical connection will look like this, then one side of the button is connected to the yellow wire that connects to INPUT pin, and the other side to the green wire that connects to 3.3V. In this example, the reading digital INPUT pin is D2, and 100k ohm resister is used as pull-down resistor. You can use smaller resister (anything bigger than 10k ohm) as pull-down or pull-up resister. 

You can also reverse the position of button and resister and make pull-up resister circuit like above. Note that in this case, the resister is connected between INPUT pin and 3.3V, and button is connected to INPUT pin on one side, and GND pin on the other side. The difference between using pull-up resister and pull-down resister is the direction of your sensor reading. If you use pull-up resister, you will read 1 (HIGH) when you do not push the button (no contact) and you will read 0 (LOW) when you push the button (contact). If you use pull-down, this will reverse. I often use pull-up resister, because you can replace the physical resister on the breadboard to internal pull-up resister that is a resister you can activate in your code. You can read about pull_up resisters >>  https://www.arduino.cc/en/Tutorial/DigitalPins

once you set up the button connections, we can read the D2 pin and control the LEDs. 

First step on the code side: create a new variable called “button” (this can be any name) and assign D2. in the setup function, declare the pinMode of your “button” as INPUT.

int led1 = D0;
int led2 = D7;
int button = D2;

void setup() {
  pinMode(led1, OUTPUT);
  pinMode(led2, OUTPUT);
  pinMode(button, INPUT);
}

Now we need to read the button pin D2. for this, we use  digitalRead() function. (there are also reference in Particle, but I am pointing to Arduino reference in this post) We need to create new variable… let’s say “buttonState” to store the result of the reading.  You can create new variable any point in the code. If you create new variable in loop function, every time the loop function gets called, the new variable of the name you specified gets created, and at the end of the loop, it gets destroyed. If you create the variable outside of the function, like the “led1” and “button” we created before, it gets created only once and stays there for the time the device is powered. 

int led1 = D0;
int led2 = D7;
int button = D2;
int buttonState;

void setup() {
  pinMode(led1, OUTPUT);
  pinMode(led2, OUTPUT);
  pinMode(button, INPUT);
}
void loop(){
buttonState = digitalRead(button);
//......
}

Now we know if the button is pushed or not, or more precisely if INPUT pin D2 is receiving 0V or 3.3V. we can use this information to decide if the LED should be ON(HIGH) or OFF(LOW). To do this, we use  if statements.

void loop(){
buttonState = digitalRead(button);
 if (buttonState == LOW){
  digitalWrite(led1, HIGH);
  }
  else{
  digitalWrite(led1, LOW);
  }

// extra small delay to avoid hiccup
delay(10);
}

This will turn the LED that is connected to led1(D0) ON when you read 0V on button (D2) pin, and else led1(D0) will be OFF. Save your code, verify and flash to your device/photon. Wait until the LED on the photon turns turquoise blue breathing light and test your button-LED. 

Now let’s see if you can  publish your data.

point1: the data that publish function takes is String type, and you need to cast your integer type data (that is what we are reading from digitalRead) to String.

String data = String(buttonState);

To publish your data in your “data” variable, you use the Particle.publish function. The first argument is the name of the event, this indicates the unique name that the data is labeled. For now, we use the event name as “buttonState”. The second argument is the actual data you are sending. This will be what is in the “data” variable. The last argument indicates if you are publishing PUBLIC or PRIVATE. We use PUBLIC for this example. If you are exchanging data between the devices that are resistered to your account, then you can use PRIVATE mode.

Particle.publish("buttonState",data, PUBLIC);

You can add above codes in loop() function.

void loop(){
buttonState = digitalRead(button);
 if (buttonState == LOW){
  digitalWrite(led1, HIGH);
  }
  else{
  digitalWrite(led1, LOW);
  }

String data = String(buttonState);
Particle.publish("buttonState",data, PUBLIC);

// extra small delay to avoid hiccup
delay(10);
}

Now you can save the code and flash your Photon to test. 

To monitor what is published from your photon, go to console tab on your IDE (2nd from the bottom), on your console page (opened in new browser window) click “my device” (looks like a single box icon) and click your photon ID from the list. This will open up the view of the device that shows events and status of the device. 

But wait! I get an error message! As these data goes over internet and published over cloud server, there are limitation in the frequency of publishing data. It recommends you to publish 1 data per second or slower. currently we publish every 10ms… 100 times per second!

The quick and dirty (and naive) way to solve this problem is to add big 1 second delay in the loop so the loop runs every 1 second. Increase the amount of delay from delay(10); to delay(1000); 

Make the change, save and flash the photon again. now when you look at the console, you can see the event publishing. when you push your button the DATA changes from 0 to 1.

Note that the reaction of the LED on your photon, and the published data is rather slow. I have to keep the button for a while until the LED come on and the data changes. This is because your photon is now checking the state of the button pin every 1 second.

Now, the final step is to control other people’s LED with your button over the internet. to do this, we use  publish and  subscribe function of the photon.

as an example, you can control LEDs connected to my photon. I added subscribe code to my photon. I have 4 LEDs and each LED is subscribing to the event called “mikas_LED1”, “mikas_LED2″… so on. 

The idea is to publish data with unique event name that matches the subscribing side, such as “mikas_LED1”.  For example, when you publish data with an event name “mikas_LED1”, and as my photon subscribes that exact event name, it will receive the data you’ve sent. Let’s try if this works. Change your event name to “mikas_LED1” from “buttonState”. save and flash. Now when you press your button, my LED should turn on.

Let’s try this with your friends. You can add new LED on D5 (long leg to D5, short leg to GND), modify your code and exchange your unique event name with your friend, so she/he can control your LED.

int led1 = D0;
int led2 = D7;
int internet_LED = D5;
int button = D2;
int buttonState;
int lastButtonState;

void setup() {
  pinMode(led1, OUTPUT);
  pinMode(led2, OUTPUT);
  pinMode(internet_LED, OUTPUT);
  pinMode(button, INPUT);
// here you subscribe to your my_unique_event_name. change the name as yourName_LED
   Particle.subscribe("my_unique_event_name", myHandler);
}

void loop(){
// save what is in the buttonState variable to lastButtonState variable
lastButtonState = buttonState;
// read new value to buttonState variable
buttonState = digitalRead(button);

 if (buttonState == LOW){
  digitalWrite(led1, HIGH);
  }
  else{
  digitalWrite(led1, LOW);
  }

// cast buttonState (integer) to string so we can use it as data for Particle.publish function
  String data = String(buttonState);

// publish the data (0 or 1) with the unique event name that the other device is subscribing
   Particle.publish("myFriends_unique_event_name", data, PUBLIC);

// wait for 1 second
    delay(1000);

}

void myHandler(const char *event, const char *data){
// casting the data back to integer    
int incomingData = atoi(data);

    if (incomingData == 0){
        digitalWrite(internet_LED, HIGH);
      }
    else{
        digitalWrite(internet_LED, LOW);
    }

}

make sure that you change the event name in subscribe function to something unique, like yourName _LED, like mika_LED. Then exchange the name with your friend. now whoever publish the event of yourName _LED will control your LED.

This is one way of connecting our bubbles over internet using Photon with publish and subscribe functions. There are few other ways you can solve this using photon environment. If you are interested, you can read their documentation and try other methods. I chose this way because it is relatively easy to set up.. but as it is publishing publicly, it is not a secure data.

EXTRA:  If you add 1 second delay in the loop, the reaction of the button also gets slow. Instead, we can publish the buttonState only when the state changes. (when it gets pushed or released) To do this, you need to  detect the state change. You can read the details of the Arduino tutorial about the state change, and also we will go through this in the course. Below is the state change detection code for our example.

int buttonState;
int lastButtonState;

void setup() {
  pinMode(led1, OUTPUT);
  pinMode(led2, OUTPUT);
  pinMode(internet_LED, OUTPUT);
  pinMode(button, INPUT);
}

void loop(){
// save what is in the buttonState variable to lastButtonState variable
lastButtonState = buttonState;
// read new value to buttonState variable
buttonState = digitalRead(button);

 if (buttonState == LOW){
  digitalWrite(led1, HIGH);
  }
  else{
  digitalWrite(led1, LOW);
  }
// check if the buttonState and lastButtonState are different or not
if (buttonState!=lastButtonState){

// cast buttonState (integer) to string so we can use it as data for Particle.publish function
  String data = String(buttonState);

// publish the data (0 or 1) with the unique event name that the other device is subscribing
   Particle.publish("unique_event_name",data, PUBLIC);
// wait for 1 second after publishing
    delay(1000);
  }

// extra small delay to avoid hiccup
delay(10);
}

June 18th: AnalogRead and Fading

this week, we look into how to read analog sensors we created, and use the data to fade LEDs.

To read analog sensors, we use the analogRead() function. This will read analog input pins on the photon. Unlike digitalRead(), which reads voltage that comes into the pin as HIGH (3.3V) or LOW (0V), analogRead() reads between 0V and 3.3V in 4096 steps (0.8mV per step). 

You can read more details of the analogRead() here >>  https://docs.particle.io/reference/device-os/firmware/photon/#analogread-adc-

But why 4096 steps? why not 0-100 or 0 – 1000?? 

This is to do with binary system that microcontrollers (and computers) operate. Imagine inside of a microcontroller is like bunch of switches. it has state of on(1) and off(0). now if you have to express numbers with these switches, how do you do that? The numbers we use is decimal system. it has 10 discrete state. you can convert this to 2 discrete system, that is called binary system. Here is how it goes.

( from Wikipedia description)

If you have 8 switches, you can express 8 numbers (0-7), if you have 4 switches, you can express 16 numbers…. If you had 12 switches how many numbers can you express?? 

The answer is 4096, and this is why the analogRead values are expressed in the number between 0 – 4096. Inside the photon, it is using 12 on/off switches to register these numbers. These switches are called bits. unit of 8 bits are called byte. The range of analogRead() varies in microcontrollers. For example Arduinos use 10 bits and it ranges 0-1023. 

To read your analog sensors, which change its electrical resistance, one needs to create a little circuit so that resistance change controls the voltage that goes into the analog input pin. This is called  voltage divider. 

Let’s do some experiment. We can make a voltage divider using fixed resisters we have, and see how the reading on photon changes.

Connect 2x 10kohm resister in series from 3.3V to GND. connect middle pint to the analog input pin A0. 

int sensorPin=A0;
int sensorValue;

void setup() {

}

void loop() {
    
    sensorValue = analogRead(sensorPin);
    
    String data = String(sensorValue);
    Particle.publish("sensorValue", data, PUBLIC);
    delay(250);
    
}

now on the photon code side: we add new variables “sensorPin” and “sensorValue”. since analog input pins are used only for inputs, we do not need to set pinMode in the setup for analog pins. it will be by default inputs. in the Loop function, instead of digitalRead(), we use analogRead(pin number).  Then to check what it is reading from the pin, we can publish the data to console. In the last course, I said the recommended speed of publishing is 1 per second, but this is a bit slow to check the behavior of the analog sensors. I experimented how fast it can go, and 4 times per second seems still ok. If this does not work for your connection, increase the delay length.

Now in your console, you will see what photon is reading from your analog input pin. it should be around 2048 as you are dividing 3.3V into half with two same size resisters. Now lets extend this experiment. we use 4x 10kohm resisters and connected them in series from 3.3V to GND.

what do you read on your photon? the first one will read around 1024, second one around 2048, and the third one around 3072. This is because your resisters are dividing the voltage according to the ratio of the resistance between GND – input Pin : input Pin – 3.3V.

Now if your sensor’s resistance range from 200 ohm to 2K ohm, you can make the voltage divider with the mean resister. “mean” is the middle of the range: 200 – 2000 ohm >> mean = (2000 – 200)/2 + 200 = 1100 ohm. we take the approximate and use 1k ohm resister. 

when the sensor is relaxed, it is 2000ohm, so the voltage is divided between 1000 ohm : 2000 ohm > 1:2  When the sensor is manipulated, it goes down to 200 ohm, so the voltage is divided between 1000 ohm : 200 ohm > 5:1 This way you will be changing the voltage going into your analog input pin as you manipulate the sensor and the photon will be able to read it. Let’s build the circuit and see if the sensorValue changes in the console.

Microcontrollers can also output in range, instead of ON/OFF. In Arduinos and photons, this is done with AnalogWrite() functions. Using this function, you can fade LED light. In fact, the microcontrollers pins can not output 1.2V or 2.5V… instead, it turns 0V and 3.3V(5V in arduino) really fast so in average of given short cycle time, it is 1.2V or 2.5V. This is called  PWM (Pulse Width Modulation)

on Photons D0, D1, D2, D3 pins can do PWM. more details at  the photon ref page. The analogWrite range is 0 – 255. 0 is off, 255 is fully on.

Now we have to scale the value we read from analogRead (0 – 4095) into range for analogWrite(0-255). To do this, we use  map() function. Then use the  constrain() function to make sure that the range does not go out of the desired range. Now the scaled range stored in fadeVal is 0-255. We can write this value to the fadeLED using  analogWrite() function.

int sensorPin=A0;
int sensorValue;

int fadeLED = D0;
int fadeVal;

void setup() {
        pinMode(fadeLED,OUTPUT);
}

void loop() {
    // read sensorPin
    sensorValue = analogRead(sensorPin);
    
    // convert sensorValue into string and store in variable "data"
    String data = String(sensorValue);
    // publish the data
    Particle.publish("sensorValue", data, PUBLIC);
    
    // map the sensorValue range into 0-255
    fadeVal = map(sensorValue, 0, 4095, 0,255);
    // make sure that the scaled value does not go out from the range 0-255
    fadeVal = constrain(fadeVal, 0,255);
    // control the fade amout of LED
    analogWrite(fadeLED, fadeVal);
    
    // delay 1/4 of second to reduce the frequency of publishing
    delay(250);
}

You may notice that your sensor reading value does not really move from 0 to 4095 but stays somewhere in the middle. Note what is the minimum and maximum of your sensor range by monitoring console. Then change the map() functions original scale, instead of second argument: 0 (minimum of original range) and third argument: 4095 (maximum of original range) to your sensors minimum and maximum. the 4th and 5th argument stays the same as it states the target range, which is 0-255.

Lastly, you can publish your analog sensor data and control the LEDs that is subscribing the data. Move your publish part of the code to the very end, after you calculate the fadeVal, and instead of sensorValue you can publish the fadeVal to event name of your friend’s unique event name and you can control her/his LEDs.

int sensorPin=A0;
int sensorValue;

int fadeLED = D0;
int fadeVal;

void setup() {
        pinMode(fadeLED,OUTPUT);
}

void loop() {
    // read sensorPin
    sensorValue = analogRead(sensorPin);
    
    
    // map the sensorValue range into 0-255
    fadeVal = map(sensorValue, 0, 4095, 0,255);
    // make sure that the scaled value does not go out from the range 0-255
    fadeVal = constrain(fadeVal, 0,255);
    // control the fade amout of LED
    analogWrite(fadeLED, fadeVal);
    
    // convert fadeVal into string and store in variable "data"
    String data = String(fadeVal);
    // publish the data
    Particle.publish("mikas_LED1", data, PUBLIC);
    
    // delay 1/4 of second to reduce the frequency of publishing
    delay(250);
}

June 25th: More Actuators!

This week, we try different actuators. In your package, there was a speaker and a vibration motor included. We will try to use them with your analog/digital sensors.

First of all, we make a small change to avoid your loop function delaying 250mS in every loop. This way, locally your photon will read sensors and controll the actuators more frequently to achieve smooth control of actuators. Instead of delay(250); reduce the delay to 10mS. This way each loop takes 10ms. now we count how many times it went through the loop, and every 25 loop, we publish the data. This way, theoretically it will publish every 250mS. 

Make a new variable int cnt=0; at the beginning of the code.

Add the following change in your loop() function. Note that delay (250); is changed to delay (10); and the part related to publishing now happens inside the if(){} only when the cnt is bigger than 25.

// add 1 to the cnt. This is same as cnt = cnt+1;
cnt++;

if (cnt==25){
  // reset the cnt to 0   
  cnt=0;
  String data = String(buttonState);
  Particle.publish("analogValue", data, PUBLIC);
}
delay(10);

Save and flash the Photon to see if your LED now fades smoothly when you manipulate the sensor. The sensor value should be still publishing to the console.

Now if you change the LED to vibration motor, you can control the motor. there is no polarity for this kind of motors.

Next, let’s try to play sound with the sensors. Connect the speaker to D3. Speakers have 2 wires coming out. One of them to D3, the other one to GND. There is no polarity.

let’s do some test. To generate sound, you use  tone() function. The first argument is pin number, the second is pitch, the third is duration of the sound, which is optional. Let’s add the following in the loop to see if you can play sounds.

tone(3,200,100);
delay(200);
tone(3,1200,100);
delay(200);
tone(3,800,100);
delay(200);

you can change the code and play this sound only when your sensor input is above/below certain number. The below example code is made for my setting. The condition for the if will change according to your sensor reading

if (sensorValue<2500){
    tone(3,200,100);
    delay(200);
    tone(3,1200,100);
    delay(200);
    tone(3,800,100);
    delay(200);
    }

If you want to play specific melody, you can check  the pitch to note table and compose it as you like.

You can use the value from the sensor to control the pitch too. Let’s say the pitch we want to play is between 200 and 2000. I assign my sensor’s relaxed state (3000) to pitch 200, and stretched state (2000) to pitch 2000 and scale with map() function.

int myPitch = map (sensorValue, 3000, 2000, 200, 2000);

Then I play this pitch with tone() function.

tone(3,myPitch,100);
delay (200);

if you add above, you will hear the tone for 100ms, and pause for 100ms. if you take the delay out, then you will hear the continuous tone. (the duration in this case will not have an affect). If you are annoyed that it plays the sound all the time, you can make it such that it only plays when the sensor is activated to certain amount.

if (sensorValue<2500){
    tone(3,myPitch,100);
    delay(200);
}

You can send this values to control other people’s speakers and/or motors, LEDs. You want to make sure that you use unique event name and agree with the range of values you are sending. (0-255, or pitch that goes up to higher value). To reduce the frequency of publishing, you can use the counter to specify when you send which data and when to reset the counter. Also, you can program it so that it will publish only the value is over certain amount. You do not need to send 0 as it will not do anything to the motor.

    cnt++;

    if (cnt==30){
        if(fadeAmount>5){
            String data = String(fadeAmount);
            Particle.publish("mikas_LED1", data, PUBLIC);
        }
    }
    if (cnt==60){
        cnt=0;
        if (myPitch > 800){
            String data2 = String(myPitch);
            Particle.publish("mikas_speaker", data2, PUBLIC);
        }
    }

    delay(10);

on the receiving side, you can add new subscribe to the setup() function

Particle.subscribe("mikas_speaker", mySpeaker);

and add new callback function. In this example case it is called mySpeaker() This will go after the loop() function, after the closing }.  This will play the speaker that is connected to D3.

void mySpeaker(const char *event, const char *data){
 int receivedPitch = atoi(data);
    tone(3,receivedPitch,100);
    delay(200);
}

July 2 : Connecting Bubbles

This week, we concentrate on connecting our bubbles with Photon using Particle.publish() and Particle.subscribe() functions.

To publish your data, it is simple. Use Particle.publish() function as we have been doing in the last weeks. We have to take care:

Make sure to publish data not too frequently. The particle suggests you to publish data/second. I tried testing and every 250mS seems to work but if you do it more frequently than that, it starts to fail.
Use unique event name to publish. You have to agree with the person who is subscribing your data and use the same unique event name.
Convert the readings from sensors to String type using String() function. Make a new String variable and store it there, and use this variable in the second argument of the Particle.publish() function.

Here is an example code that you can place in your loop function.

// count up the cnt variable every time you pass the loop  
cnt=cnt+1;

// only if the cnt becomes 25, you publish the data. As the loop has 10mS delay, this will make it happen every ~250mS 
  if (cnt==25){
    // convert sensorValue into string and store in variable "data"
    String data = String(sensorValue);
    // publish the data. First argument is the event name, second is the data (string type), third indicates if it is public or private
    Particle.publish("unique_event_name", data, PUBLIC);
    // reset the counter
    cnt=0;      
  }
    delay(10);

To subscribe data published by someone, you add Particle.subscribe() function in setup() function. You add it to setup() and not to loop() because you want it to happen only once and not in every loop.

Particle.subscribe("unique_subscription_event_name", myHandler);

The second argument of the Particle.subscribe() function is the call back. This means when you get the data from the “unique_subscription_event_name”, the call back function gets called: in this case it is called myHander() function. This myHandler() function is something you create in your code, outside of your loop() function. As it is outside of the loop(), it does not get exacted as long as your Photon goes through the loop. When someone publish data to “unique_subscription_event_name”, then the myHandler() function gets called, and whatever you have written inside this function gets exacted.

Within the myHandler() (or you can call the function any name you like), you need to take care few things:

In this example, I am passing two arguments, event name and the data. This is what is happening in (const char *event, const char *data) part. 
I need to convert the data (Strign) back to integer (number). I am using atoi() function.

void myHandler(const char *event, const char *data){
 int val = atoi(data);
    // here you can do anything you like, for example you can play a tone with the received data as the pitch.
    tone(D3,val);
}

You can subscribe up to 4 events. If you have multiple subscription, you probably want to create call back functions for each event, and write what should happen when data is published for each of these events.

// this part should be in the setup() function
Particle.subscribe("unique_event_name_1", myLED);
Particle.subscribe("unique_event_name_2", myMotor);

void myLED(const char *event, const char *data){
 int val = atoi(data);
    // in this example, I turn on/off the LED
    if (data==1){
        digitalWrite(D0, HIGH);
     }
    else{
        digitalWrite(D0, LOW);
    }
}

void myMotor(const char *event, const char *data){
 int val = atoi(data);
    // in this example, I turn control a motor
    analogWrite(D1,val);
}

Make a pair with your friend and exchange the event name you publish/subscribe. See if you can control your partner’s actuators using your sensors. You can also think of the scenario, what action controls which actuator in what way… and what this could mean in your remote interaction with your friends.

In the course, we also tried controlling speakers. We made a subscription of a new event, that is publishing the pitch value in setup()

Particle.subscribe("uniqueName_speaker", mySpeaker);

and made a call back function that is called mySpeaker()

void mySpeaker(const char *event, const char *data){
    int incoming_data = atoi(data);
    tone ( D3, incoming_data, 100);
    delay(200);  
}

The above code will play the pitch that comes in from the “uniqueName_speaker” event. We know already that the data published under this name is in the range of pitch so we can use it directly.

If you find it is annoying that the speaker is playing the sound all the time, we can use if statements and play the sound only when the pitch is high (this means the person sending the data is activating the analog sensor)

void mySpeaker(const char *event, const char *data){
    int incoming_data = atoi(data);
    if (incoming_data>1000){
        tone ( D3, incoming_data, 100);
        delay(200);  
    }
}

Or you can play fixed melody whenever you receive higher value data (meaning when someone is activating the sensor)

void mySpeaker(const char *event, const char *data){
    int incoming_data = atoi(data);
     if (incoming_data >1000 ){
         tone(D3, 800, 100);
         delay(200);
         tone(D3, 1200, 100);
         delay(200);
         tone(D3, 1600, 100);
         delay(200);  
    }
}

Of course you can also use digital switch to activate melody like above as well. In this case, the data you receive will be 1 or 0 and you will need to make the if() cases accordingly.

Code from today’s course: group1

int sensorPin=A0;
int val;
int cnt;
int fade; // used for analogwrite, 0 -255
int pitch;

void setup() {
    pinMode(sensorPin, INPUT);
    pinMode(D0, OUTPUT);
    
    Particle.subscribe("name1_fade", myFade);
    Particle.subscribe("name2_speaker", mySpeaker);
}

void loop() {
    val = analogRead(sensorPin);
    fade = map (val, 1000, 3000, 0, 255);
    fade = constrain(fade, 0, 255);
    
    pitch = map (val, 800, 3000, 800, 2000);
    pitch = constrain(pitch, 800, 2000);
    
 
    
    cnt = cnt+1;
    
    if (cnt == 25){
    String data = String ( pitch);
    Particle.publish("val", data, PUBLIC);
    cnt = 0;
    }
    
    delay(10);
}

void myFade(const char *event, const char *data){
    int myLEDfade = atoi(data);
   analogWrite(D0, myLEDfade); 
}

void mySpeaker(const char *event, const char *data){
    int myPitch = atoi(data);
     if (myPitch >1000 ){
         
    tone(D3, 800, 100);
    delay(200);
    tone(D3, 1200, 100);
    delay(200);
    tone(D3, 1600, 100);
    delay(200);
    
    }
}

Code from today’s course: group2

int val;
int fade;
int pitch;

void setup() {
    pinMode (D0, OUTPUT);
    Particle.subscribe("name1_fade", myLED);
    Particle.subscribe("name2_pitch", mySpeaker);

}

void loop() {
    val  = analogRead(A0);
    fade = map ( val, 600, 3000, 0, 255 );
    fade = constrain( fade, 0 , 255);
    
    
    pitch = map ( val, 600, 3000, 600, 2000 );
    
    String data = String(pitch);
    Particle.publish("val", data , PUBLIC);
    delay(250);

}

void myLED(const char *event, const char *data){
    int incoming_data = atoi(data);
    analogWrite(D0,incoming_data );
}

void mySpeaker(const char *event, const char *data){
    int incoming_data = atoi(data);

    tone ( D3, incoming_data, 100);
    delay(200);
 
}
