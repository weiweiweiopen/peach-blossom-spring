---
source: How To Get What You Want / KOBAKANT DIY
title: "ATtiny: Sound"
url: "https://www.kobakant.at/DIY/?p=4382"
postId: 4382
date: "2012-06-23T09:30:10"
modified: "2013-08-09T11:54:42"
slug: "attiny-sound"
imported: "2026-05-16 10:16"
---

<!-- pbs-source:htgwyw -->
#pbs/source/htgwyw

# ATtiny: Sound

Source: https://www.kobakant.at/DIY/?p=4382

## Excerpt

Following some examples of running sound on the ATtiny.

## Content

Following some examples of running sound on the ATtiny.

Checking inputs while playing sound

When reading inputs while playing sound one had to work around the “delay” used in most sound functions.

Option 1) Use a counter instead of the delay function

>>  http://www.uchobby.com/index.php/2012/01/21/replacing-delay-in-arduino-sketches-istime-to-the-rescue/

Option 2) Use a hardware interrupt to interrupt sound loop

Video >>  http://www.youtube.com/watch?v=0aAwKT0YWJU

>>  http://www.avrfreaks.net/index.php?name=PNphpBB2&file=viewtopic&t=105493

Leah’s beep function

Taken from >>  http://web.media.mit.edu/~leah/LilyPad/07_sound.html

// code for sound and led output on an ATtiny85

// using leah buechley’s sound code, taken from:  http://web.media.mit.edu/~leah/LilyPad/07_sound_code.html

int speakerPin = 8;

void setup()

{

  pinMode(speakerPin, OUTPUT);

}

void loop() {

beep(speakerPin, 2800, 1000);	//plays frequency of 2800 for 1 second

scale(C);	//plays note C for half a second

}

void scale (char note)

{

  if(note == ‘C’)

    beep(speakerPin,2093,500); 	//C: play the note C (C7 from the chart linked to above) for 500ms

  if(note == ‘D’)

    beep(speakerPin,2349,500); 	//D

  if(note == ‘E’)

    beep(speakerPin,2637,500); 	//E

  if(note == ‘F’)

    beep(speakerPin,2793,500); 	//F

  if(note == ‘G’)

    beep(speakerPin,3136,500); 	//G

  if(note == ‘A’)

    beep(speakerPin,3520,500); 	//A

  if(note == ‘B’)

    beep(speakerPin,3951,500); 	//B

  if(note == ‘H’)

    beep(speakerPin,4186,500); 	//C

} 

void beep (unsigned char speakerPin, int frequencyInHertz, long timeInMilliseconds)     // the sound producing function

{

  int x;

  long delayAmount = (long)(1000000/frequencyInHertz);

  long loopTime = (long)((timeInMilliseconds*1000)/(delayAmount*2));

  for (x=0;x
