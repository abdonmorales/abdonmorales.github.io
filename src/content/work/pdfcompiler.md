---
title: PDF Compiler
publishDate: 2024-06-01 01:00:00
img: /assets/duke-java/vector/Thinking.svg
img_alt: A bright pink sheet of paper used to wrap flowers curves in front of rich blue background
description: |
  Created a PDF Merger for fun since I had to search for a tool online (most of them looked sketchy) and around this time I was learning Python. I thought it would be a fun project to work on during my free time.
tags:
  - Development
  - Java
  - Python
  - Fun
---

# PDF Compiler: A Journey of Languages, Pain, and Fun

## A Journey of Languages

To start off, I had a Calculus assignment due around midnight last semseter; and I had to submit it as a PDF. Sometimes, I would forget to scan the extra question or I added a bit more to [an/a] previous equation to solve it, and would need to scan it as a seperate PDF. I would then have to merge the PDFs together. I would search for a tool online, but most of them looked sketchy. I was learning Python around this time, so I thought it would be a fun project to create a PDF merger.

When I began developing this application around October of 2023, I was thinking of a name for this thing to solve my small abohrrent inconvenience. I thought of "PDF Compiler" because it compiles PDFs together like a compiler compiles code. I thought it was a cool name, so I went with it. For the programming language, it was between Python and Java since I was about to learn Java in the upcoming semester, and I have had some previous intermediate experience with Python in application development. At first, the interface of the 1.0 version of the PDF Compiler was the crappy UI of tkinter for UI elements and handling, until version 2.0 (Decemeberish of 2023) when I decided to use Qt4 for the UI which was a much needed graphical improvement to at least ease the eyes of the user.

## The Pain

Around this time of rewriting the UI from tkinter to Qt4, the way I originally packaged my file was by just distributing the raw source file through the .pyw extension until version 2.0. After the Qt4 rewrite, I completely changed the way on how I packged the file by using some type of universal packaging tool to which the name I have forgotten. The pain was on how the user is unable to launch the application in its executable form without no explanation of the error or why it's unable to execute. This only fuled my frustration with Python and packaging tools to the point of rewriting the whole codebase of the application in Java.

**P.S After this, I was learning Java since I was about to take a Java course in the upcoming semester for intro CS class.**

## The Fun Times

There was no fun times. I was learning Java and I was in pain; just kidding.

With learning Java in my intro CS class, I was literally applying the concept of "real world" problems to the max. I was able to apply the concepts of OOP, inheritance, polymorphism, and encapsulation to core abstraction of the PDF Compiler knowing the upcoming task of rewriting from Python to Java was no simple overtaking...well maybe. Overall, the only necessary changes was rewriting the interface into Java AWT's Swing (not FX) and packaging the application into a .jar file in which Sun/Oracle provides such great documentation of how to do so. The application was then distributed as a .jar file and the end user was able to execute the application without any issues (I tested it myself on multiple machines).

**Below is the Git for the PDF Compiler: <a href="https://github.com/moralesresearch/PDF-Compiler">Source Code</a>**