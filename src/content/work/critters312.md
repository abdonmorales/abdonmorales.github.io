---
title: Critters for CS 312
publishDate: 2025-09-25 13:01:00
img: /assets/critter-312.png
img_alt: Critters for CS 312
description: |-
  
tags: 
  - Java
  - Basic Data Structures
  - Objected-Oriented Programming
---

# Critters for CS 312

## Description

For Programming Assignment 10 in CS 312, we build a small ecosystem of “Critters” in Java. Each critter is just a Java class that extends a common `Critter` superclass, but together they form a full graphical simulation: they move around a 2D grid, fight, eat, sometimes mate, and try to out-survive each other in a toroidal (wrap-around) world.

The twist: after implementing four specified species (`Ant`, `Bird`, `Hippo`, and `Vulture`), we design our own custom `Longhorn` critter that tries to dominate the simulation using strategy.

In this post, I’ll walk through:

- How the simulator works at a high level  
- The behavior of each critter I had to implement  
- How I approached designing the Longhorn critter  
- Testing strategies and what I learned from the assignment  

---

## The World & Core Mechanics

The provided code gives us a 2D grid world and a GUI. We **don’t** manage the simulation loop ourselves—`CritterMain.java` does all of that. Our job is to override behavior hooks inside subclasses of `Critter`.

Key ideas:

- The world is a **torus**  
  - Walk off the right edge → you appear on the left  
  - Walk off the top → you reappear at the bottom  
- Coordinates:  
  - Top-left is `(0, 0)`  
  - `x` increases to the right, `y` increases downward  
- Default size: `60 x 50`, though that can change via GUI options  

Each “round” of the simulation:

1. Every critter chooses a move via `getMove()`.
2. If two critters land on the same square, they **fight**.
3. If a critter lands on food (`"."`), the simulator calls `eat()` to see if it wants to eat.
4. The GUI redraws, calling `toString()` and `getColor()` on each critter to show them on screen.

None of that logic lives in our classes; we just implement behavior through a fixed API.

---

## The Critter API

Every critter is a subclass of `Critter` that can override some or all of these methods:

- `public boolean eat()`  
  Decide whether to eat food when on the same square.

- `public Attack fight(String opponent)`  
  Decide which attack to use when in combat with another critter. Valid attacks are:
  - `Attack.ROAR`
  - `Attack.POUNCE`
  - `Attack.SCRATCH`
  - `Attack.FORFEIT` (basically “give up”)

- `public Color getColor()`  
  Decide the color used to draw this critter.

- `public Direction getMove()`  
  Decide whether to move `NORTH`, `SOUTH`, `EAST`, `WEST`, or stay `CENTER`.

- `public String toString()`  
  Decide what **single-character** string represents this critter on the board.

There are also useful helper methods we can call from inside our critters:

- `getX()`, `getY()` – current position  
- `getWidth()`, `getHeight()` – dimensions of the world  
- `getNeighbor(Direction dir)` – what character is next to us in a given direction (space = empty)  

Plus event callbacks we *may* override (especially useful for `Longhorn`):

- `win()`, `lose()` – after a fight  
- `sleep()`, `wakeup()` – when we get put to sleep from eating  
- `mate()`, `mateEnd()` – when mating begins/ends  
- `reset()` – when the world restarts  

---

## Combat System in a Nutshell

Fights are rock/paper/scissors-ish but with three attacks and `FORFEIT`. A very simplified view:

- Same attack vs same attack → random winner  
- Each of `ROAR`, `POUNCE`, and `SCRATCH` “beats” one and “loses” to one  
- `FORFEIT` loses to anything that’s not also forfeiting  

This matters a lot when designing an intelligent critter like `Longhorn`: knowing what other species tend to use gives you a chance to counter them.

---

## Provided Files vs. Files We Implement

We are **not** supposed to modify:

- `CritterMain.java` – GUI + simulation engine  
- `MiniMain.java` – small text-based tester  
- `Critter.java` – superclass for all critters  
- `Stone.java` – a simple built-in critter

We **do** implement:

- `Ant.java`  
- `Bird.java`  
- `Hippo.java`  
- `Vulture.java`  
- `Longhorn.java` (our custom species)

Each file must have the standard CS 312 academic honesty header, and each class must have exactly one constructor with the specified parameters.

---

## Ant: Zig-Zag Workhorse

**Constructor**

```java
public Ant(boolean walkSouth)
```

**Main behaviors**

- **Movement**:  
  - If `walkSouth == true`: moves in a repeated pattern `S, E, S, E, ...`  
  - If `walkSouth == false`: moves `N, E, N, E, ...`  
  This creates a zig-zag trail either trending south or north.

- **Eating**:  
  - Always eats (`eat()` always returns `true`).

- **Fighting**:  
  - Always uses `Attack.SCRATCH`.

- **Appearance**:  
  - `toString()` returns `"%"`.  
  - `getColor()` returns red.

Ants are simple but predictable—good practice for basic state (alternating movement using a boolean or an index into a final array of directions).

---

## Bird: Clockwise Square with Directional Icons

**Constructor**

```java
public Bird()
```

**Movement**

- Moves in a **clockwise square**, three steps per side:
  - `NORTH` 3 times
  - `EAST` 3 times
  - `SOUTH` 3 times
  - `WEST` 3 times
  - Then repeats

This is a perfect use case for the “final arrays for states” requirement, like:

```java
private static final Direction[] BIRD_DIRECTIONS =
    {Direction.NORTH, Direction.EAST, Direction.SOUTH, Direction.WEST};
```

We track how many steps we’ve taken in the current direction and when it hits 3, we advance to the next direction.

**Eating**

- Never eats (`eat()` always returns `false`).

**Fighting**

- If the opponent **looks like an Ant** (`opponent.equals("%")`), the bird uses `Attack.ROAR`.
- Otherwise, it uses `Attack.POUNCE`.

**Appearance**

- Depends on its last move:
  - `"^"` if last move was `NORTH` or it hasn’t moved yet
  - `">"` if last move was `EAST`
  - `"V"` if last move was `SOUTH`
  - `"<"` if last move was `WEST`
- Color: blue.

This class is really about tying **internal state** (current direction, step count, last move) to both `getMove()` and `toString()`.

---

## Hippo: Hunger-Based Logic

**Constructor**

```java
public Hippo(int hunger)
```

Here, `hunger` means: “How many times in my life will I say yes to `eat()`?”

**Hunger & Eating**

- Hippo keeps an internal counter of how many more times it will eat.
- `eat()`:
  - Returns `true` while that counter is > 0
  - Decrements the counter each time it returns `true`
  - Returns `false` once the counter hits 0

**Fighting**

- If the Hippo is still hungry (i.e., `eat()` *would* return `true`), it uses `Attack.SCRATCH`.
- If it’s no longer hungry, it uses `Attack.POUNCE`.

So fighting style changes over the Hippo’s “lifetime.”

**Movement**

- Moves in one direction for 5 steps (N, S, E, or W).
- After 5 steps, it chooses a **new random direction** that is *different* from the current one.
- Repeats that pattern: 5 steps, change direction, 5 steps, etc.

Again, a good use of `final` arrays plus some randomness.

**Appearance**

- `toString()` returns the Hippo’s **remaining hunger** as a string:
  - Start: `"4"` if constructed as `Hippo(4)`
  - After one successful eat: `"3"`, and so on
  - Once it’s full: `"0"`
- `getColor()`:
  - Gray if hungry
  - White if full

---

## Vulture: A Hungry Bird Variant

`Vulture` is like a modified `Bird` with hunger and different graphics.

**Constructor**

```java
public Vulture()
```

**Movement**

- **Identical** movement pattern to `Bird`:
  - North 3, East 3, South 3, West 3, repeat.

**Eating**

- Vulture has a **binary hunger state**:
  - Initially hungry → `eat()` returns `true` the next time it sees food, then it becomes full.
  - While full → `eat()` returns `false`.
- Any time the vulture gets into **one or more fights** (i.e., `fight()` is called), it becomes hungry again.
- So the cycle is:
  - Hungry → eats once → full  
  - Fights (one or many) → hungry again → eats once → full → …

**Fighting**

- Same pattern as `Bird`:
  - If the opponent looks like an Ant (`"%"`), `Attack.ROAR`.
  - Otherwise, `Attack.POUNCE`.

**Appearance**

- Same directional characters as `Bird`:
  - `"^"`, `">"`, `"V"`, `"<"` based on last move.
- Color: black.

This class demonstrates inheritance nicely: you can reuse most of the Bird logic and just add hunger and override the relevant methods.

---

## Longhorn: BIT-RAND Chaos Critter

My custom species is implemented as the class `Longhorn_Abdon_Morales` and I think of it as a **BIT-RAND** critter: it’s noisy, unpredictable, and constantly flickering both in color and in its on‑screen symbol.

### Fields and Constructor

The class keeps a handful of constants and state:

- `Random rand` – shared PRNG for all of Longhorn’s decisions
- `DATABIT_FLOW = 32` – starting index for the ASCII range I care about
- `RAND_CHAR_SIZE = 127` – size of the character table
- `char[] RAND_CHAR` – an ASCII-style lookup table
- `Direction[] ALL_DIRS = { SOUTH, EAST, NORTH, WEST }` – the only directions Longhorn will ever move
- `Color[] RGB_LIGHTS = { RED, GREEN, BLUE }` – the cycling colors
- `int currentDirection` – index into `ALL_DIRS` used to avoid repeating the previous move
- `int currentColor` – index into `RGB_LIGHTS` for the color cycle

In the constructor, I fill the `RAND_CHAR` array from character code 32 up to 126:

```java
public Longhorn_Abdon_Morales() {
    for (int i = DATABIT_FLOW; i < RAND_CHAR_SIZE; i++) {
        RAND_CHAR[i] = (char) i;
    }
}
```

That effectively creates an ASCII-ish table of printable characters that I later sample from in `toString()`. The lower entries (below 32) remain the default `\u0000` character, which sometimes show up visually as blanks and add even more visual noise.

### Color: Cycling RGB “LEDs”

`getColor()` uses `currentColor` to walk through `RGB_LIGHTS`:

```java
public Color getColor() {
    if (currentColor < RGB_LIGHTS.length - 1) {
        currentColor++;
        return RGB_LIGHTS[currentColor];
    }
    currentColor = 0;
    return RGB_LIGHTS[currentColor];
}
```

In practice this makes Longhorn **cycle through GREEN → BLUE → RED → GREEN → ...** every time the GUI asks for its color, giving it a subtle RGB‑strobe effect as the simulation runs.

### Fighting: Targeted Counters for Known Species

The `fight(String opponent)` method is simple but tuned to the known critters in the assignment:

```java
public Attack fight(String opponent) {
    if (opponent.equals("%")) {
        return Attack.ROAR;        // counter Ant
    } else if (opponent.equals("S")) {
        return Attack.POUNCE;      // counter Stone
    }
    return Attack.SCRATCH;         // default vs everything else
}
```

- Against **Ants** (`"%"`), Longhorn always uses `ROAR`.
- Against **Stones** (`"S"`), it uses `POUNCE`, taking advantage of Stone’s predictable `ROAR` behavior.
- Against everything else (Birds, Hippos, Vultures, and any unknown species), it falls back on `SCRATCH`.

This gives Longhorn a small strategic edge against the most predictable species while keeping its interactions with others relatively straightforward.

### Eating: Always Take the Free Energy

The eating strategy is intentionally aggressive:

```java
public boolean eat() {
    return true;
}
```

Longhorn **never turns down food**. This boosts its chances of staying alive in the long run, even if it means occasionally being put to sleep by the simulator’s rules.

### Movement: Non-Repeating Random Walk

Movement is where the “chaos” really comes in. I wanted Longhorn to wander in a way that:

- Is truly random between the four cardinal directions, and
- Never repeats the same direction twice in a row.

That logic lives in `getMove()`:

```java
public Direction getMove() {
    int temp = rand.nextInt(ALL_DIRS.length);
    while (currentDirection == temp) {
        temp = rand.nextInt(ALL_DIRS.length);
    }
    currentDirection = temp;
    return ALL_DIRS[currentDirection];
}
```

On each move:

1. Pick a random index into `ALL_DIRS`.
2. If it matches `currentDirection`, keep re‑rolling.
3. Once a new direction is chosen, store it and return that direction.

The result is an erratic, jittery **non‑repeating random walk** across the toroidal grid. Longhorn doesn’t deliberately chase food or enemies; instead, it sweeps the map in a noisy way that, over time, still covers a lot of ground.

### String Representation: Random ASCII Flicker

Finally, `toString()` decides what symbol to show for Longhorn on the board:

```java
public String toString() {
    return "" + RAND_CHAR[rand.nextInt(RAND_CHAR_SIZE)];
}
```

Every time the GUI asks for Longhorn’s string, it picks a **random entry** from the `RAND_CHAR` table. Because that table holds most of the printable ASCII range (and some blanks), Longhorn appears as a constantly changing mix of punctuation, letters, digits, and occasional “invisible” spots.

Visually, this makes each Longhorn look like a noisy RGB LED that’s constantly glitching its glyph. Combined with the color cycle and random walk, BIT‑RAND Longhorns are easy to spot and fun to watch—even if they’re a little chaotic to predict.

---

## Testing & Debugging

There’s no fixed output file to diff against, so testing is more manual and interactive:

1. **MiniMain.java**
   - Run this small tester to verify:
     - Movement patterns (e.g., Bird's square, Ant’s zig-zag, Hippo’s 5-step moves)
     - Eating logic (especially hunger-limited behavior)
     - `toString()` and color logic

2. **GUI Simulation**
   - Start with a **small world** and **few critters** to make it easier to track behavior.
   - Enable the **Debug output** checkbox to see logs about fights, eating, and movement.
   - Try different mixes of critters:
     - Only Ants and Birds
     - Add Hippos
     - Add Vultures
     - Finally introduce the Longhorn and watch if it tends to dominate long-term.

3. **Edge Cases**
   - Make sure:
     - Hippo hunger never goes negative.
     - Vulture hunger toggles correctly after fights.
     - Longhorn doesn’t crash when fighting unknown critter types.
     - No critter ever returns a string longer than length 1 from `toString()`.

---

## Takeaways

This assignment is a great sandbox for practicing:

- **Object-Oriented Programming**
  - Inheritance (`extends Critter`, Vulture extending Bird)
  - Overriding methods
  - Using final arrays to represent state machines

- **Stateful Behavior**
  - Tracking hunger, movement phases, fight outcomes
  - Using instance fields to carry state across simulation rounds

- **Designing “AI-lite” Behaviors**
  - Even with simple enums and strings, you can get surprisingly complex interactions.
  - The Longhorn class especially feels like building a tiny agent for a game.

It’s also just fun to run the simulation for a few thousand steps, sit back, and see if your Longhorn army actually takes over the world—or gets wiped out by a horde of surprisingly effective Hippos.

If you’re working through this assignment yourself, I’d recommend:

- Implement each critter one by one and test with `MiniMain` as you go.
- Keep your Longhorn strategy simple at first, then iterate.
- Use comments generously to explain how your critter thinks—future you (and your TA) will thank you.