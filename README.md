# clos-dispatch

Elegant multiple dispatch for JavaScript — with optional CLOS-style method combinations.

---

## What is This?

`clos-dispatch` gives you an expressive, flexible function dispatch system based on the **runtime types of *all* arguments** — not just the first one (like traditional object-oriented dispatch).

At its simplest, it helps you eliminate messy `if...else` or `switch` logic.
At its most powerful, it gives you **CLOS-style hooks** to customize how functions run — with :before, :after, and :around layers.
:primary is the default (when you don't specify the :primary layer - it the method will be automatically set to :primary).

You can start simple, and grow into its power.

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

// Implicit :primary — just like a normal multimethod
// In this example a simple single dispatch
speak[[['Dog']]] = () => "Woof!";
speak[[['Cat']]] = () => "Meow!";

console.log(speak(new Dog())); // "Woof!"
console.log(speak(new Cat())); // "Meow!"
```

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

print[[['PDF']]] = () => "Rendering PDF";
print[[['WordDoc']]] = () => "Printing Word document";
print[[['Email']]] = () => "Forwarding to email printer";

console.log(print(new PDF()));      // "Rendering PDF"
console.log(print(new Email()));    // "Forwarding to email printer"
```

You can also match *multiple arguments*:

```js
const interact = closDispatch();

interact[[['Dog', 'Cat']]] = () => "Dog chases cat";
interact[[['Cat', 'Dog']]] = () => "Cat hisses at dog";

console.log(interact(new Dog(), new Cat()));
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
const feed = closDispatch();

feed[[['Dog']]] = () => "Eats dog food"; // :primary (implicitly)

feed[[['Dog'], ':before']] = () => console.log("Dog wags tail");
feed[[['Dog'], ':after']]  = () => console.log("Dog licks bowl");
feed[[['Dog'], ':around']] = (callNext, dog) => {
  console.log("Opening cupboard...");
  const result = callNext(dog);
  console.log("Closing cupboard.");
  return result;
};

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

// Register a handler
fn[[['PDF']]] = (pdf) => ...           // implicit :primary
fn[[['PDF'], ':primary']] = (pdf) => ...
fn[[['PDF'], ':before']]  = (pdf) => ...
fn[[['PDF'], ':after']]   = (pdf) => ...
fn[[['PDF'], ':around']]  = (callNext, pdf) => ...
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
const fight = closDispatch();

fight[[['Dog', 'Dog']]] = () => "Dog vs Dog!";
fight[[['Cat', 'Cat']]] = () => "Cat stare down...";
fight[[['Animal', 'Animal'], ':around']] = (callNext, a, b) => {
  console.log("Arena lights up");
  const result = callNext(a, b);
  console.log("Arena quiets");
  return result;
};

console.log(fight(new Dog(), new Dog()));
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

eligibility[[['Patient', 'Trial', '*']]] = () => false;


// === Business Rule 1: Marker-based precision trial eligibility ===

eligibility[[['Patient', 'OncologyTrial', '*']]] = (p, trial) => {
  const required = trial.requiredMarker;
  return p.biomarkers?.[required] === 'positive';
};


// === Business Rule 2: All high-risk patients excluded from COVID trials in Europe ===

eligibility[[['Patient', 'CovidTrial', 'Europe']]] = (p) => {
  return p.risk !== 'high';
};


// === :before for warning on missing biomarker info ===

eligibility[[['Patient', 'OncologyTrial', '*'], ':before']] = (p, trial) => {
  const marker = trial.requiredMarker;
  if (!(marker in (p.biomarkers || {}))) {
    console.warn(`!! Patient missing biomarker info for ${marker}`);
  }
};


// === :around for audit + decision override ===

eligibility[[['Patient', 'Trial', '*'], ':around']] = (callNext, p, t, r) => {
  console.log(`Evaluating ${t.constructor.name} for ${p.sex}, ${p.age}y with ${p.disease}`);
  const result = callNext(p, t, r);

  if (p.risk === 'low' && t instanceof CovidTrial) {
    console.log('Note: low-risk override for COVID trial');
    return true; // override
  }

  console.log(result ? 'Eligible' : 'Not eligible');
  return result;
};


// ==== Realistic Scenario ====

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

console.log(eligibility(alice, trial1, eu)); // HER2+ breast cancer → true
console.log(eligibility(bob, trial1, eu));   // HER2- → false
console.log(eligibility(bob, trial2, eu));   // high risk → false
console.log(eligibility(clara, trial2, eu)); // low-risk override → true
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
    this.requiresMRI = requiresMRI; // boolean
  }
}

// === Business Rule 3: NeuroTrials in Asia require an MRI result ===

eligibility[[['Patient', 'NeuroTrial', 'Asia']]] = (p, trial) => {
  return !trial.requiresMRI || p.biomarkers?.MRI === 'done';
};

// === :before to warn about missing MRI data ===

eligibility[[['Patient', 'NeuroTrial', 'Asia'], ':before']] = (p, trial) => {
  if (trial.requiresMRI && !('MRI' in (p.biomarkers || {}))) {
    console.warn(`!! Missing MRI data for neuro trial`);
  }
};
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
console.log(eligibility(dave, neuroMRI, asia));     // MRI done → true
console.log(eligibility(erin, neuroMRI, asia));     // MRI missing → false
console.log(eligibility(erin, neuroNoMRI, asia));   // MRI not required → true
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
try {
  const sum = closDispatch();
  sum[[['Number', 'Number']]] = (a, b) => a + b;
  console.log(sum("hi", 3));
} catch (e) {
  console.log("Error:", e.message); // No matching method for given types
}
```

---

## Project Structure

```
clos-dispatch/
├── src/clos-dispatch.js
├── tests/clos-dispatch.test.js
├── README.md
├── package.json
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
