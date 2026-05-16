---
source: How To Get What You Want / KOBAKANT DIY
title: "What is Variables?"
url: "https://www.kobakant.at/DIY/?p=8995"
postId: 8995
date: "2021-04-25T15:16:47"
modified: "2021-04-25T15:23:01"
slug: "what-is-variables"
imported: "2026-05-16 10:16"
---

<!-- pbs-source:htgwyw -->
#pbs/source/htgwyw

# What is Variables?

Source: https://www.kobakant.at/DIY/?p=8995

## Excerpt

When starting to learn programming, one of the concept that is hard to grasp (it was hard to grasp for me…) is “variables”. “In computer programming, a variable or scalar is a storage location (identified by a memory address) paired with an associated symbolic name, which contains some known or unknown quantity of information referred […]

## Content

When starting to learn programming, one of the concept that is hard to grasp (it was hard to grasp for me…) is “variables”.

“In computer programming, a variable or scalar is a storage location (identified by a memory address) paired with an associated symbolic name, which contains some known or unknown quantity of information referred to as a value.” ( wikipedia)

For example, when you open Arduino example sketches, you will see it at the very top, before the setup() function, a sentence like “int val = 0:” These are declaring variables. Or in the loop() function “int sensorVal = analogRead(A0);”  in this case, it declares variables and immediately assigning value to it.

Anyway, for long time, it was hard for me to grasp this concept, and here is how I picture what Variables are.

You create a container box, and label it with a unique name. In this case, I give a name “val1″. This name can be anything.. but it is a good idea to give something meaningful so you can remember later what is what… It is same as you organizing your storage. If you give arbitrary name to your storage boxes, it will become difficult to know what is stored where… so it is a good idea to think of a naming system. Note that you can not use space ” ” in your labeling name. if you need to use space, often people uses “_” or capitalization of the second word to keep it readable.

When you create a containers, you need to specify the size of the container. The size depends on  how many bits you need in order to express the data you want to store in your variable container. For example,  boolean is only 1 or 0, and you need only 1 bit.  integer (int) uses 16 bit and can store numbers between -32768 to 32768, but it can not express point numbers (i.e. 2.6 or 8.432). If you need to store point numbers, you need  float, which is 32bits. 

Here, I made 2 boolean variables, val1 and val2. The beans represents bits. standing = 1, laying = 0.

boolean val1=0;
boolean val2=1;

 

val2 = val1;

The above operation means that: first look into what is in val1 container (0) and put that data into val2 container. so after this operation, both val1 and val2 contain 0.

another confusing one is an operation like this one:

val1 = val1 + 1;

   

In this case, you first look into what is in val1 container… which is “0”. Then add +1 to it (0 +1) then the result goes into what is on the left side of “=” that is val1. You can take the content from a variable container, calculate/operate and put it back to the same container. This is used very often and it seems confusing… but once you get the idea, it is actually very useful. 

For example:

int counter = 0;
loop(){
counter = counter + 1;
}

This will make the counter count up every time loop() function runs… up to 32768. Then it will come back to 0 and counts up again.

You can also make a shelf storage instead of individual boxes. It is called  array. This becomes handy if you are storing related objects. For example, when you are storing different size screws, instead of storing them in individual boxes that is called “screw_3mm”, “screw_5mm”… you can also use a shelf for screws and keep various screws in each drawers. This will be much easier to organize. Array story will come in another time.
