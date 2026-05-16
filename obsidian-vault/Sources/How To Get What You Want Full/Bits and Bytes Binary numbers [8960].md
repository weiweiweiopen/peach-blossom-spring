---
source: How To Get What You Want / KOBAKANT DIY
title: "Bits and Bytes Binary numbers"
url: "https://www.kobakant.at/DIY/?p=8960"
postId: 8960
date: "2021-04-25T13:16:50"
modified: "2021-04-25T13:55:29"
slug: "bits-and-bytes-binary-numbers"
imported: "2026-05-16 10:16"
---

<!-- pbs-source:htgwyw -->
#pbs/source/htgwyw

# Bits and Bytes Binary numbers

Source: https://www.kobakant.at/DIY/?p=8960

## Excerpt

Computers and microcontrollers internally represent numbers (and all the data) with 0 and 1. This is because these chips are made of a lot of switches that has two states ON (1) and OFF (0). If you look at the historic photos of early computers you will see a lot of switches and operators manually […]

## Content

Computers and microcontrollers internally represent numbers (and all the data) with 0 and 1. This is because these chips are made of a lot of switches that has two states ON (1) and OFF (0). If you look at the historic photos of early computers you will see a lot of switches and operators manually switching them On and Off. 

We are used to count numbers like 0, 1,2 ….8, 9, 10, 11. This is called decimal system. The way computers count with 0 and 1 is called binary system. To understand how computers/microcontrollers work, it is useful to understand how they “think”.

Decimal to Binary

Here is how binary counting works. Each bean is a digit, that has two states, ON (1) and OFF (0). 

When there is one bean, it can express only 0 and 1.

 

When you add second bean, it can now express 2 and 3, four numbers in total.

 

with 3 beans, you can count 4,5…7. Eight numbers.

       

and with 4 beans, you can count …. up to 15, that is total of sixteen numbers. 

In binary counting, you can express the amount of numbers as 2 to the power of “Number of beans (digits)”. For example, if you use 4 digits, you can express 2 to the power of 4 = 16. With 4 digits, you can count up 0 -15. 

We often hear the word “bit” and “byte” in computer terminologies. A bit is same as a bean in the above example. 1 digit in binary, one switch that can hold ON or OFF.

8bits makes another unit, byte. 1 byte contains 8 bits, and it can express 2 to the power of 8 = 256 numbers, from 0 to 255.

In Arudino microcontrollers, Analog signals coming into Analog input pins are expressed with 10 bits. It can express numbers 2 to the power of 10 = 1024 numbers. That is why the range of AnalogRead() is 0-1023.

Some other microcontroller systems may use more bits to convert analog signals to digital data. In this case the data ranges bigger scale to express voltage between 0V-5V. When you have bigger range, it means it has finer resolution. This is sometimes useful when you have sensors that has very small change and you have to amplify the data. For example your reading moves only from 2V to 2.5V. In 10bit ADC, your reading range changes only about 100, while in 12 bit scale it will range about 400.
