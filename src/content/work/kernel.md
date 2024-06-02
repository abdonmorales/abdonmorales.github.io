---
title: Linux and the SUN Kernel
publishDate: 2020-03-02 00:00:00
img: /assets/stock-1.jpg
img_alt: Iridescent ripples of a bright blue and pink liquid
description: |
  Developing a Linux kernel for independent research and use for my early startup, UniSoft in 2018 with our SUN kernel.
tags:
  - Kernel
  - Dev
  - Testing
---

## Research and the Early Phase of the SUN Kernel

> The development of the SUN kernel in 2018 made learn more of the complexity the Linux kernel has become since the early days of Unix in 1982.

In the early days of UniSoft in the summer of 2018, me and some friends from the college prepatory began to explore more complex projects after finishing our first year of high school. Previously, we had taken AP Computer Science Principles which gaves us an indepth and abstract view of programming (since the course was based around block programming and simple JavaScript web programs) and we have been wanting for the past year to explore beyond the areas we have learned. Thus, in the fall of 2018, we began to explore the Linux kernel and how it works; from there we formed a team to began the development of the SUN kernel for our future project. The SUN operating system. 

### The SUN Kernel (2018 - 2021)

The SUN kernel was a project that was started in the fall of 2018 and was the first project that we had worked on as a team. The kernel was based on the Linux kernel and was developed in C. The kernel was later developed for the SUN operating system which was a project that we had been working on in late (December) 2018 into 2019. With a team of 5 people, we began to work on the kernel using Linux 5.10.9 which was the stable version during that time. In the first few release of the SUN kernel, the intent was to be a more improved Linux kernel with bettery memory management due to C inefficencies in the area. However, after we began internally testing SUN operating system, we began to reorganize the kernel to be more efficient and to be more compatible with the SUN operating system, thus making a sort of competition against the Linux kernel.

Fast foward to 2021, we realized that around the 25th release of the kernel (now renamed back to the Linux kernel) that continuing to develop a semi-independent kernel and the operating system was not ideal and we didn't have the resources to continue to develop the kernel and the operating system. Thus, we decided to stop development of the SUN kernel (with the last release being 2.3.1) and rebase it with Linux 5.13.1. The kernel was renamed back to the Linux kernel and we began to continue work on the SUN operating system with the Linux kernel as the base. Unfortunately, the SUN operating system stopped being developed in late 2021 due to the lack of resources and the lack of updated packages with syncing with Arch Linux.

#### Project Repository
**[SUN/Linux Kernel](https://github.com/moralesresearch/kernel)**

**As of April 2023, our Linux kernel repository will sunset and will be archived on Jan 1, 2024. Fork the project if necessary; the repository will be kept for historical purposes and will not be updated.**