---
source: How To Get What You Want / KOBAKANT DIY
title: "ATtiny: Soft Fade"
url: "https://www.kobakant.at/DIY/?p=3393"
postId: 3393
date: "2012-03-09T04:23:07"
modified: "2013-06-23T09:24:24"
slug: "attiny85-software-pwm"
imported: "2026-05-16 10:16"
---

<!-- pbs-source:htgwyw -->
#pbs/source/htgwyw

# ATtiny: Soft Fade

Source: https://www.kobakant.at/DIY/?p=3393

## Excerpt

PWM (“analog output”) on all five i/o pins of an ATtiny using software PWM!

## Content

PWM (“analog output”) on all five i/o pins of an ATtiny using software PWM!

The software PWM code was written by Ernst Christensen, I found it in the following Arduino forum thread:

>>  http://arduino.cc/forum/index.php/topic,75334.0.html

Example of fabric circuit using software PWM code >>  http://www.kobakant.at/DIY/?p=3395

My slightly edited version of Ernst’s code:

// code for ATtiny

// fades LEDs on all five pins on and off using software PWM

#define fadeSpeed 20

void setup(){

  for(int pin=0;pin<5;pin++) pinMode(pin, OUTPUT);
}
void loop(){
  for(int pin=0;pin<5;pin++) {
    for(int fade=1;fade<254;fade++) { //fade on
      softPWM(pin, fade, fadeSpeed);
    }
    for(int fade=254;fade>1;fade–) { //fade off

      softPWM(pin, fade, fadeSpeed);

      }

    }

  }

  void softPWM(int pin, int freq, int sp) { // software PWM function that fakes analog output

    digitalWrite(pin,HIGH); //on

    delayMicroseconds(sp*freq);

    digitalWrite(pin,LOW); //off

    delayMicroseconds(sp*(255-freq));

  }
