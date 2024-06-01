---
title: UTSA Python Camp
publishDate: 2019-10-02 00:00:00
img: /assets/stock-4.jpg
img_alt: Soft pink and baby blue water ripples together in a subtle texture.
description: |
  In this Python Camp, we developed a data collection program in Python that pulled near-earth asteroids from the NASA datasets. We will the project the data on a graph data manipulation and modeling.
tags:
  - Summer Camp
  - Astronomy
  - Online
  - CAMEE
---

This project or camp was a 4 to 5 week course of introductory programming with object-oriented programming in mind. In the first, week we went over the basics, which cover the topics of encapsulation, inheritance, access modifiers, programming abstraction, and polymorphism. In addition, we start going porgramming using sample or exemplar programs that went over Python's data types, collection data types, classes and functions, conditions and loops, and If Else statments.

**Here's some example code that we went over that covered these areas:**

```
example_integer = 56
example_float = 2.0
example_string = "Hello World"
example_boolean = True

print("Example of an integer: ", example_integer)
print("Example of an float: ", example_float)
print("Example of an string: ", example_string)
print("Example of an boolean: ", example_boolean)
```

```
class Person:
  def __init__(self,name,age):
    self.name = name
    self.age = age

john_doe = Person("John Doe", 25)
jane_doe = Person("Jane Doe", 26)

print(john_doe.name)
print(jane_doe.name)
```

Around the midcourse of the camp, we began to apply high-level programming abstraction on how to approach our data analysis methods, the creation of figures to model our data, and taking into account predictive analysis methods. Such as the one below:

```
# Find the value of Q1 and Q3
meteorite_description = meteorite_data['mass (g)'].describe()
print(meteorite_description,'\n')
# Calculate the inter-quartile range of the dataset
IQR = meteorite_description["75%"] - meteorite_description["25%"]
# Calculate the upper and lower limit of the data
upper_limit = meteorite_description["75%"] + (1.5*IQR)
lower_limit = meteorite_description["25%"] - (1.5*IQR)

# Create a mask for all data between these values
mask = (meteorite_data['mass (g)'] < upper_limit) & (meteorite_data['mass (g)']> lower_limit)
# Apply the mask to the data to remove outliers
processed_meteorite_data = meteorite_data.loc[mask]
print(processed_meteorite_data['mass (g)'].describe())
```

Overall, this camp psuhed my visions beyond the horizon to begin looking into higher-level programming such as C, C++, Rust, and other high-level langauges. Furthermore, it made me think more logicial beyond the scope of programming and computer science, but also certain aspects of life and day-to-day living, communication, and learning.

#### Project Repository
**[UTSA Python Camp GitHub repo](https://github.com/abdonmorales/UTSA-PythonBootCamp)**

**(c) 2021 Abdon Morales**