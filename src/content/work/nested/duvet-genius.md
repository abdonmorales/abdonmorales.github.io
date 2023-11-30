---
title: Graphy
publishDate: 2020-03-04 00:00:00
img: /assets/stock-3.jpg
img_alt: Pearls of silky soft white cotton, bubble up under vibrant lighting
description: |
  We developed a graphical calculator using normal expression with your result using MatPlotLib, Numpy, and Sympy libraries.
tags:
  - Design
  - Dev
  - Python
---

# Graphy Release 1

## Key Features

1. **User Interface**: Utilizes Tkinter to create a user-friendly and interactive graphical interface.
2. **Function Input**: Allows users to input mathematical functions in a dedicated entry field.
3. **Mathematical Operations**: Users can append mathematical symbols (+, -, *, /, sqrt, abs, ^) to the input function directly from the UI.
4. **Graph Plotting**: The core functionality of Graphy lies in its ability to plot the input functions. It uses Matplotlib for plotting 2D graphs of the input functions over a range of x-values.
5. **Navigation and Interaction**: Includes a navigation toolbar from Matplotlib's backend for enhanced interaction with the plotted graphs.
6. **Table of Values**: Features an additional functionality to display a table showing x and y values of the plotted function.
7. **Error Handling**: The code includes try-except blocks to handle errors in function plotting and evaluation, ensuring robustness.
8. **Future Expandability**: The code contains placeholders and comments for potential future features like 3D plotting and solving equations, indicating plans for further development.

## Technical Implementation
- Uses NumPy for generating linearly spaced numbers (used as x-values for plotting).
- Employs SymPy for advanced symbolic mathematics, although this feature is more outlined for future releases.
- The matplotlib library is integrated into the Tkinter window to display the graph within the application interface.
- The code structure is object-oriented, with a main class `GraphingCalculator` encapsulating all the functionalities.

## Potential Enhancements
- Implementation of 3D graph plotting.
- Incorporating features for differentiating, integrating, and solving functions, as indicated by the commented sections.

## Usage
Users can run the application, input a mathematical function, and use the provided buttons to modify or plot the function. The application provides a visual graph representation of the function and a table of values for detailed analysis.

#### Project Repository
**[Graphy git repo](https://github.com/abdonmorales/Graphy)**

**(c) 2023 Morales Research Inc.**