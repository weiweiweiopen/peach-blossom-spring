---
source: How To Get What You Want / KOBAKANT DIY
title: "Stirring Queen Mask"
url: "https://www.kobakant.at/DIY/?p=6532"
postId: 6532
date: "2017-03-13T14:36:39"
modified: "2017-03-14T07:42:34"
slug: "sugar-queen-mask"
imported: "2026-05-16 10:16"
---

<!-- pbs-source:htgwyw -->
#pbs/source/htgwyw

# Stirring Queen Mask

Source: https://www.kobakant.at/DIY/?p=6532

## Excerpt

Made in the Hybrid Craft Lab of the Hebrew University in Jerusalem, for the Jewish carnival celebration Purim, this mask is made from spoons and sticks intended for stirring sugar and milk into coffee.

## Content

Made in the  Hybrid Craft Lab of the Hebrew University in Jerusalem, for the Jewish carnival celebration Purim, this mask is made from spoons and sticks intended for stirring sugar and milk into coffee.

Inspired by the shape and abundance of these waste-producing products, unfortunately the mask was not made from used stirring sticks and spoons.

Flickr set >>  https://www.flickr.com/photos/plusea/albums/72157681273298536
 
.flickr_badge_image {margin:0px;display:inline;}
.flickr_badge_image img {border: 1px solid #ffffff !important; padding:1px; margin:2px;}
#flickr_badge_wrapper {width:900px;text-align:left}

Front and back:

Mask pattern

coming soon!

Circuit sketch

Circuit diagram

coming soon!

Materials and Tools

– wooden stirring sticks

– plastic stirring spoons

– leather

– craft glue

– copper tape

– ATtiny microcontroller

– LED lights

– masking tape

– coin-cell battery and holder

– soldering iron

– ATtiny programmer (or an Arduino)

Code

/*

   Charlieplexing and software PWM on an Attiny85 to individually control 12 LEDs from 4 i/o pins – n * (n-1).

   One i/o pin is still free and could be used for mode button.

   Modified from the original spwm code by Ernst Christensen 16.okt. 2011

*/

int led[] = {

  1, 2, 3, 4

};

int numberPins = 4;

int numberCharlies = 12;

int delayTime = 12;

int testDelay = 250;

int charliePin;

int reMap[] = {

  5, 9, 8, 12, 6, 7, 11, 2, 4, 10, 1, 3

};

int reKnight[] = {

  3, 10, 2, 7, 12, 9, 5, 8, 6, 11, 4, 1

};

boolean state = 0;

void setup() {

}

void loop() {

  for (int t = 0; t < 100; t++) {
    knightRider();
  }
  for (int t = 0; t < 100; t++) {
    randomLight();
  }
  for (int t = 0; t < 100; t++) {
    backForth();
  }
}

void knightRider() {
  for (int i = 0; i < numberCharlies; i ++) {
    for (int t = 0; t < 500; t += 1) {
      charliePlex(reKnight[i]);
      digitalWrite(charliePin, HIGH);
    }
  }
  for (int i = numberCharlies; i > 0; i –) {

    for (int t = 0; t < 500; t += 1) {
      charliePlex(reKnight[i]);
      digitalWrite(charliePin, HIGH);
    }
  }
}

void randomLight() {
  int r = random(numberCharlies);
  int d = random(1, 15);
  for (int i = 0; i < 255; i++) {
    charliePlex(reMap[r]);
    spwm(i, charliePin, d);
  }
  for (int i = 255; i > 0; i–) {

    charliePlex(reMap[r]);

    spwm(i, charliePin, d);

  }

}

void backForth() {

  for (int i = 0; i < numberCharlies; i += 2) {
    for (int t = 0; t < 1000; t += 1) {
      charliePlex(reMap[i]);
      digitalWrite(charliePin, HIGH);
      charliePlex(reMap[i + 1]);
      digitalWrite(charliePin, HIGH);
    }
  }
  for (int i = numberCharlies; i > 0; i -= 2) {

    for (int t = 0; t < 2000; t += 1) {
      charliePlex(reMap[i]);
      digitalWrite(charliePin, HIGH);
      charliePlex(reMap[i + 1]);
      digitalWrite(charliePin, HIGH);
    }
  }
}

void charliePlex(int myLed) {
  switch (myLed) {
    // 1
    case 1:
      pinMode(4, OUTPUT);
      pinMode(1, OUTPUT);
      pinMode(2, INPUT);
      pinMode(3, INPUT);
      digitalWrite(4, LOW);
      charliePin = 1;
      break;

    // 2
    case 2:
      pinMode(4, OUTPUT);
      pinMode(1, INPUT);
      pinMode(2, OUTPUT);
      pinMode(3, INPUT);
      digitalWrite(4, LOW);
      charliePin = 2;
      break;

    // 3
    case 3:
      pinMode(4, OUTPUT);
      pinMode(1, INPUT);
      pinMode(2, INPUT);
      pinMode(3, OUTPUT);
      digitalWrite(4, LOW);
      charliePin = 3;
      break;

    // 4
    case 4:
      pinMode(4, OUTPUT);
      pinMode(1, OUTPUT);
      pinMode(2, INPUT);
      pinMode(3, INPUT);
      digitalWrite(1, LOW);
      charliePin = 4;
      break;

    // 5
    case 5:
      pinMode(4, INPUT);
      pinMode(1, OUTPUT);
      pinMode(2, OUTPUT);
      pinMode(3, INPUT);
      digitalWrite(1, LOW);
      charliePin = 2;
      break;

    // 6
    case 6:
      pinMode(4, INPUT);
      pinMode(1, OUTPUT);
      pinMode(2, INPUT);
      pinMode(3, OUTPUT);
      digitalWrite(1, LOW);
      charliePin = 3;
      break;

    // 7
    case 7:
      pinMode(4, OUTPUT);
      pinMode(1, INPUT);
      pinMode(2, OUTPUT);
      pinMode(3, INPUT);
      digitalWrite(2, LOW);
      charliePin = 4;
      break;

    // 8
    case 8:
      pinMode(4, INPUT);
      pinMode(1, OUTPUT);
      pinMode(2, OUTPUT);
      pinMode(3, INPUT);
      digitalWrite(2, LOW);
      charliePin = 1;
      break;

    // 9
    case 9:
      pinMode(4, INPUT);
      pinMode(1, INPUT);
      pinMode(2, OUTPUT);
      pinMode(3, OUTPUT);
      digitalWrite(2, LOW);
      charliePin = 3;
      break;

    // 10
    case 10:
      pinMode(4, OUTPUT);
      pinMode(1, INPUT);
      pinMode(2, INPUT);
      pinMode(3, OUTPUT);
      digitalWrite(3, LOW);
      charliePin = 4;
      break;

    // 11
    case 11:
      pinMode(4, INPUT);
      pinMode(1, OUTPUT);
      pinMode(2, INPUT);
      pinMode(3, OUTPUT);
      digitalWrite(3, LOW);
      charliePin = 1;
      break;

    // 12
    case 12:
      pinMode(4, INPUT);
      pinMode(1, INPUT);
      pinMode(2, OUTPUT);
      pinMode(3, OUTPUT);
      digitalWrite(3, LOW);
      charliePin = 2;
      break;
  }
}

void spwm(int freq, int spin, int sp) {
  //on
  digitalWrite(spin, HIGH);
  delayMicroseconds(sp * freq);
  // off
  digitalWrite(spin, LOW);
  delayMicroseconds(sp * (255 - freq));
}
