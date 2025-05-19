---
title: Longhorn Network
description: A social network simulation project for ECE 422C at UT Austin, implementing roommate matching and internship referral systems
publishDate: 2025-05-20
#img: /assets/RGB_formal_Cockrell_Cockrell.jpg
img: /assets/LonghornLogo.svg
tags: ["Java", "Algorithms", "Graph Theory", "Swing UI", "Multithreading"]
---

# Longhorn Network

Longhorn Network is a sophisticated social network simulation project developed for ECE 422C at the University of Texas at Austin. The project implements advanced algorithms for roommate matching and internship referral systems, demonstrating practical applications of graph theory and algorithm design.

## Project Overview

The Longhorn Network system provides:
- Implementation of the Gale-Shapley algorithm for roommate matching
- Graph-based referral path finding using Dijkstra's algorithm
- Connection strength calculation between students
- Multithreaded friend request and chat system
- Interactive Swing UI for visualization

## Technical Implementation

The system is built using:
- Java as the primary programming language
- Graph data structures for student connections
- Swing UI for visualization
- Multithreading for concurrent operations
- Advanced algorithms (Gale-Shapley, Dijkstra's)

## Key Features

- **Roommate Matching**: Implements the Gale-Shapley algorithm to create stable roommate pairs based on student preferences
- **Referral Path Finding**: Uses Dijkstra's algorithm to find optimal paths to students with specific internship experiences
- **Connection Strength**: Calculates relationship strength based on:
  - Roommate status (+4 points)
  - Shared internships (+3 points each)
  - Same major (+2 points)
  - Same age (+1 point)
- **Multithreaded Operations**: Concurrent handling of friend requests and chat messages
- **Interactive UI**: Visual representation of:
  - Student graph with weighted connections
  - Roommate assignments
  - Referral paths
  - Friend requests and chat histories

## Development Goals

- Demonstrate practical implementation of advanced algorithms
- Create an efficient and scalable social network simulation
- Provide intuitive visualization of complex relationships
- Ensure thread-safe concurrent operations
- Implement robust error handling for edge cases

## Future Enhancements

- Enhanced visualization options
- Additional matching algorithms
- Extended social features
- Performance optimizations
- Mobile application interface

#### Project Repository
**[Longhorn Network Lab GitHub repo](https://github.com/abdonmorales/longhorn-network-lab)**

**(c) 2025 Abdon Morales**