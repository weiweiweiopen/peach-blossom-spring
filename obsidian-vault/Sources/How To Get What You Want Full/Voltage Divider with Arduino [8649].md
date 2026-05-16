---
source: How To Get What You Want / KOBAKANT DIY
title: "Voltage Divider with Arduino"
url: "https://www.kobakant.at/DIY/?p=8649"
postId: 8649
date: "2021-01-25T19:14:05"
modified: "2021-01-25T20:47:21"
slug: "voltage-divider-with-arduino"
imported: "2026-05-16 10:16"
---

<!-- pbs-source:htgwyw -->
#pbs/source/htgwyw

# Voltage Divider with Arduino

Source: https://www.kobakant.at/DIY/?p=8649

## Excerpt

You can divide the voltage with 2 resisters. The voltage gets divided according to the ratio between the 2 resisters. Let’s make an experiment. Here, 5V is divided with 2 resisters. both of them are 10k ohm, so ratio 1:1. I connect the middle to A0, which we are reading with the current code on […]

## Content

You can divide the voltage with 2 resisters. The voltage gets divided according to the ratio between the 2 resisters. Let’s make an experiment.

 

Here, 5V is divided with 2 resisters. both of them are 10k ohm, so ratio 1:1. I connect the middle to A0, which we are reading with the current code on Arduino. What do you see in serial monitor?

 

Now I change right side resister to 1k ohm. the ratio between the two resisters are 10:1. Now what is your analog pin reading?

 

Now I change the right side resister to 47K ohm. Ratio between the two is 1:4,7  What does your analog pin reads?

Notice when the resistance of right side resister change, the ratio between the two resister change and resulting in the change in incoming voltage at the reading point. As your analog sensor also changes the resistance as you manipulate, it works similar to this right side resister. You just need to use a resister on the left that works with your sensor’s resistance range. For example, if your sensor range is 100 ohm to 600 ohm and you had 10k ohm fix resister, then the ratio goes from 1:100 to 6:100. That is not a big change. If you changed your resister to 100 ohm, the ratio change now goes from 1:1 to 6:1. This will result in bigger reading range.

 

*note: the above image made with frizing shows knitted button as a sensor. You can connect any resistive sensor instead. Knitted buttons are actually digital sensor (on/off) but as there were no suitable component installed on my frizing software, it is used as a general “textile sensor”

Serial Plotter

You can use the plotter (graph) tool of Arduino IDE to monitor your sensor behavior. Add these four lines before Serial.println() to fix the plotting range.

int myValue = 0;
 void setup() {
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
 delay(10);
  }

Open plotter from Tools/Serial Plotter. It opens a new window and graphs what your are printing out.
