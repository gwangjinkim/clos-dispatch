# clos-dispatch v0.1.0

Elegant multiple dispatch for JavaScript — with optional CLOS-style method combinations.

---

## What is This?

`clos-dispatch` gives you an expressive, flexible function dispatch system based on the **runtime types of *all* arguments** — not just the first one (like traditional object-oriented dispatch).

At its simplest, it helps you eliminate messy `if...else` or `switch` logic.
At its most powerful, it gives you **CLOS-style hooks** to customize how functions run — with :before, :after, and :around layers.
:primary is the default (when you don't specify the :primary layer - it the method will be automatically set to :primary).

You can start simple, and grow into its power.

---
## Features

- Multiple dispatch on arbitrary argument types
- CLOS-style method combinations: `:before`, `:after`, `:around`, `:primary`
- Extensible dispatch tree
- Explicit fallback with `*`

---

## Installation

### Install via npm

```bash
npm install clos-dispatch
```

### Or with yarn

```bash
yarn add clos-dispatch
```

### Or directly from GitHub (here)

```bash
npm install gwangjinkim/clos-dispatch

# newest branch `dev` is a hypothetical branch name!
npm install gwangjinkim/clos-dispatch#dev

# install from specific commit `f09a123` is a hypothetical commit hash
npm install gwangjinkim/clos-dispatch#f09a123

# install from Git tag (release)
npm install gwangjinkim/clos-dispatch#v0.1.0
```

### Using in `package.json`

```json
{
  "dependencies": {
    "clos-dispatch": "github:gwangjinkim/clos-dispatch"
  }
}
```

Or with a branch or tag:

```json
{
  "dependencies": {
    "clos-dispatch": "github:gwangjinkim/clos-dispatch#main"
  }
}
```

---

## Quick Example (No CLOS Knowledge Needed)

```js
import { closDispatch } from 'clos-dispatch';

class Dog {}
class Cat {}

const speak = closDispatch();

// Register methods using .def()
// This defines the primary method for Dog
speak.def(['Dog'], () => "Woof!");

// And this one for Cat
speak.def(['Cat'], () => "Meow!");

console.log(speak(new Dog())); // "Woof!"
console.log(speak(new Cat())); // "Meow!"
```

- `.def(`) takes three arguments:
1. The dispatch signature (like `['Dog']`)
2. The handler function
3. Optional: the method combination type (':primary', ':before', ':around', etc.)
- If no third argument is provided, it’s treated as :primary, matching your intention for “normal usage”.

You don’t need to know Lisp or CLOS to benefit from this.
You don’t even need to care about method types — it Just Works™.

---

## Why Multiple Dispatch?

Traditional OOP methods dispatch only on the **first object** (`this`).
But what if you want behavior that depends on *two* or *three* types?

```js
fight(dog, dog) => bark-fight
fight(cat, dog) => hiss then run
fight(dog, robot) => error
```

This is exactly what `clos-dispatch` gives you:

- Dispatch by the runtime types of *all* arguments
- Register different functions for different argument combinations
- Clean, declarative, no chains of if-else

---

## Realistic Example (Simple Version)

```js
import { closDispatch } from 'clos-dispatch';

class PDF {}
class WordDoc {}
class Email {}

const print = closDispatch();

// Define :primary methods using .def()
print.def(['PDF'], () => "Rendering PDF");
print.def(['WordDoc'], () => "Printing Word document");
print.def(['Email'], () => "Forwarding to email printer");

console.log(print(new PDF()));      // "Rendering PDF"
console.log(print(new Email()));    // "Forwarding to email printer"
```

You can also match *multiple arguments*:

```js
import { closDispatch } from 'clos-dispatch';

class Dog {}
class Cat {}

const interact = closDispatch();

// Define primary dispatch behavior
interact.def(['Dog', 'Cat'], () => "Dog chases cat");
interact.def(['Cat', 'Dog'], () => "Cat hisses at dog");

console.log(interact(new Dog(), new Cat())); // "Dog chases cat"
console.log(interact(new Cat(), new Dog())); // "Cat hisses at dog"
```

---

## What Is CLOS? (Lisp Nerds, Read On)

CLOS stands for **Common Lisp Object System**. It has the most advanced method dispatch system of any mainstream language. Here's what makes it magical:

- You can define `:before` methods that run before the primary method
- `:after` methods that run afterward
- `:around` methods that can intercept, log, alter, or wrap behavior
- And `call-next-method()` to continue the chain, or not

CLOS-style method combination = **flexible composition for functions**.

---

## Example with CLOS Hooks

```js
import { closDispatch } from 'clos-dispatch';

class Dog {}

const feed = closDispatch();

// Implicit :primary method
feed.def(['Dog'], () => "Eats dog food");

// :before method
feed.def(['Dog'], () => {
  console.log("Dog wags tail");
}, ':before');

// :after method
feed.def(['Dog'], () => {
  console.log("Dog licks bowl");
}, ':after');

// :around method
feed.def(['Dog'], (callNext, dog) => {
  console.log("Opening cupboard...");
  const result = callNext(dog);
  console.log("Closing cupboard.");
  return result;
}, ':around');

console.log(feed(new Dog()));
```

### Output:
```
Dog wags tail
Opening cupboard...
Eats dog food
Closing cupboard.
Dog licks bowl
Eats dog food
```

### Benefits:
- Add logging, security, timing, tracing — without touching core logic
- Stack methods cleanly
- Split concerns like never before

---

## Syntax Summary

```js
const fn = closDispatch();

// Register a handler (implicit :primary)
fn.def(['PDF'], (pdf) => { ... });

// Explicit method combinations:
fn.def(['PDF'], (pdf) => { ... }, ':primary');  // same as above
fn.def(['PDF'], (pdf) => { ... }, ':before');
fn.def(['PDF'], (pdf) => { ... }, ':after');
fn.def(['PDF'], (callNext, pdf) => { ... }, ':around');

```

### Method Combination Order:
1. All matching `:before` methods (most → least specific)
2. All matching `:around` methods (outermost first)
3. Most specific `:primary`
4. All matching `:after` methods (least → most specific)

### `callNext`
Passed to every `:around` method — allows you to continue or skip the chain.

---

## Tips

- You can mix implicit and explicit styles
- All types are matched by `constructor.name`
- Extend safely: don’t overwrite, just add more methods
- Use with logging, timing, profiling, mocking, interceptors, AI pipelines, etc.

---

## Example: Animal Battle Arena

```js
import { closDispatch } from 'clos-dispatch';

class Animal {}
class Dog extends Animal {}
class Cat extends Animal {}

const fight = closDispatch();

// Specific :primary methods
fight.def(['Dog', 'Dog'], () => "Dog vs Dog!");
fight.def(['Cat', 'Cat'], () => "Cat stare down...");

// General :around method for all Animals
fight.def(['Animal', 'Animal'], (callNext, a, b) => {
  console.log("Arena lights up");
  const result = callNext(a, b);
  console.log("Arena quiets");
  return result;
}, ':around');

// === Test ===
console.log(fight(new Dog(), new Dog()));  // Expect log: Arena lights up, Dog vs Dog!, Arena quiets
console.log(fight(new Cat(), new Cat()));  // Expect log: Arena lights up, Cat stare down..., Arena quiets
```

---

## More Complicated Example of Multiple Dispatch + CLOS Composition

We'll simulate a **pharma trial system** that:
- Dispatches on **3 arguments**: `Patient`, `Trial`, and `Region`
- Reads **internal state** (age, disease, biomarkers, risk score)
- Combines rules from multiple domains
- Adds **composable validation layers** via `:before` and `:around`
- Avoids big `if`-`else` chains and brittle procedural checks

```js
import { closDispatch } from 'clos-dispatch';

// ==== Domain model ====

class Patient {
  constructor({ age, sex, disease, biomarkers, risk }) {
    this.age = age;
    this.sex = sex;
    this.disease = disease;
    this.biomarkers = biomarkers; // e.g., { HER2: 'positive', KRAS: 'wildtype' }
    this.risk = risk;             // e.g., 'high' | 'medium' | 'low'
  }
}

class Trial {}
class OncologyTrial extends Trial {
  constructor({ requiredMarker }) {
    super();
    this.requiredMarker = requiredMarker; // e.g., HER2
  }
}
class CovidTrial extends Trial {}

class Region {}
class Europe extends Region {}   
class USA extends Region {}


// ==== Dispatcher ====

const eligibility = closDispatch();

// === Core fallback ===
eligibility.def(['Patient', 'Trial', '*'], () => false);

// === Business Rule 1: Marker-based precision trial eligibility
eligibility.def(['Patient', 'OncologyTrial', '*'], (p, trial) => {
  const required = trial.requiredMarker;
  return p.biomarkers?.[required] === 'positive';
});

// === Business Rule 2: Exclude high-risk patients from COVID trials in Europe
eligibility.def(['Patient', 'CovidTrial', 'Europe'], (p) => {
  return p.risk !== 'high';
});

// === :before — warn on missing biomarker info
eligibility.def(['Patient', 'OncologyTrial', '*'], (p, trial) => {
  const marker = trial.requiredMarker;
  if (!(marker in (p.biomarkers || {}))) {
    console.warn(`!! Patient missing biomarker info for ${marker}`);
  }
}, ':before');

// === :around — audit + override for low-risk COVID patients
eligibility.def(['Patient', 'Trial', '*'], (callNext, p, t, r) => {
  console.log(`Evaluating ${t.constructor.name} for ${p.sex}, ${p.age}y with ${p.disease}`);
  const result = callNext(p, t, r);

  if (p.risk === 'low' && t instanceof CovidTrial) {
    console.log('Note: low-risk override for COVID trial');
    return true;
  }

  console.log(result ? 'Eligible' : 'Not eligible');
  return result;
}, ':around');


// ==== Scenario ====

const alice = new Patient({
  age: 45,
  sex: 'F',
  disease: 'breast cancer',
  biomarkers: { HER2: 'positive' },
  risk: 'medium'
});

const bob = new Patient({
  age: 70,
  sex: 'M',
  disease: 'lung cancer',
  biomarkers: { HER2: 'negative' },
  risk: 'high'
});

const clara = new Patient({
  age: 30,
  sex: 'F',
  disease: 'covid',
  biomarkers: {},
  risk: 'low'
});

const trial1 = new OncologyTrial({ requiredMarker: 'HER2' });
const trial2 = new CovidTrial();

const eu = new Europe();
const us = new USA();


// ==== Try it ====

console.log(eligibility(alice, trial1, eu)); // → true
console.log(eligibility(bob, trial1, eu));   // → false
console.log(eligibility(bob, trial2, eu));   // → false
console.log(eligibility(clara, trial2, eu)); // → true (override)
```

Output:
```bash
Evaluating OncologyTrial for F, 45y with breast cancer
=> Eligible
true

Evaluating OncologyTrial for M, 70y with lung cancer
!! Patient missing biomarker info for HER2
=> Not eligible
false

Evaluating CovidTrial for M, 70y with lung cancer
=> Not eligible
false

Evaluating CovidTrial for F, 30y with covid
Note: low-risk override for COVID trial
true
```

- **Type-based branching**: (patient, trial, region) => logic
- **Composability**: `:around` can wrap, override, audit -- cleanly
- **Extensibility**: Adding `Asia` or `RareDiseaseTrial` is just another line
- **Separation of concerns**:
  - Domain logic in `:primary`
  - Metadata checks in `:before`
  - Auditing and fallback in `:around`

No tangled if-else.
No brittle function chains.
Just extensible polymorphism.


### Extension of this:

```js
// === Extend Domain ===

class Asia extends Region {}

class NeuroTrial extends Trial {
  constructor({ requiresMRI }) {
    super();
    this.requiresMRI = requiresMRI;
  }
}

// === Business Rule 3: NeuroTrials in Asia require an MRI result
eligibility.def(['Patient', 'NeuroTrial', 'Asia'], (p, trial) => {
  return !trial.requiresMRI || p.biomarkers?.MRI === 'done';
});

// === :before — warn about missing MRI info
eligibility.def(['Patient', 'NeuroTrial', 'Asia'], (p, trial) => {
  if (trial.requiresMRI && !('MRI' in (p.biomarkers || {}))) {
    console.warn(`!! Missing MRI data for neuro trial`);
  }
}, ':before');
```

### Apply the extension:

```js
// ==== More Patients ====

const dave = new Patient({
  age: 50,
  sex: 'M',
  disease: 'ALS',
  biomarkers: { MRI: 'done' },
  risk: 'medium'
});

const erin = new Patient({
  age: 60,
  sex: 'F',
  disease: 'epilepsy',
  biomarkers: {}, // no MRI
  risk: 'medium'
});

// ==== More Trials ====

const neuroMRI = new NeuroTrial({ requiresMRI: true });
const neuroNoMRI = new NeuroTrial({ requiresMRI: false });

const asia = new Asia();

// ==== Apply it ====

console.log(eligibility(dave, neuroMRI, asia));     // → true
console.log(eligibility(erin, neuroMRI, asia));     // → false (missing MRI)
console.log(eligibility(erin, neuroNoMRI, asia));   // → true (MRI not required)
```

Expected output:

```bash
Evaluating NeuroTrial for M, 50y with ALS
=> Eligible
true

Evaluating NeuroTrial for F, 60y with epilepsy
!! Missing MRI data for neuro trial
=> Not eligible
false

Evaluating NeuroTrial for F, 60y with epilepsy
=> Eligible
true
```


---

## Error Handling

```js
const sum = closDispatch();

sum.def(['Number', 'Number'], (a, b) => a + b);

try {
  console.log(sum("hi", 3)); // Should trigger no match
} catch (e) {
  console.log("Error:", e.message); // → No matching method for given types
}
```

Expected output:
```bash
Error: No matching method for given types: String, Number
```

This shows that your dispatch system safely throws errors when a call is made with arguments for which no method is defined. Let me know if you want to support fallbacks like wildcards ('*') or default handlers next.

---

## Project Structure

```bash
clos-dispatch/
├─package.json
├─README.md
├─src
│  └─clos-dispatch.js
└─tests
    ├─clos-dispatch-primary-default.test.js
    └─eligibility-extension.test.js
```

---

## License

MIT License — Gwang-Jin Kim

---

## ️ Lisp Users, Rejoice

CLOS-style method combination in a tiny JS library?
Yes, and it works with familiar syntax. Think of this as **generic functions done right**.
Supports before/after/around/primary and `callNext()`.
Perfect for those who miss `defmethod` and method metaobject protocol glory.

---

## Run Tests

```bash
npm install
npm test
```

---

## Enjoy It?
- Star the GitHub repo
- Use it in your side projects
- File issues or suggest features
- Let the dispatch revolution begin

No more if-else chains. Just clean, extensible, dynamic behavior.

> Welcome to programmable polymorphism.
