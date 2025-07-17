// tests/eligibility-extension.test.js

import { closDispatch } from '../src/clos-dispatch.js';

// ==== Domain Model (Base) ====

class Patient {
  constructor({ age, sex, disease, biomarkers, risk }) {
    this.age = age;
    this.sex = sex;
    this.disease = disease;
    this.biomarkers = biomarkers;
    this.risk = risk;
  }
}

class Trial {}
class OncologyTrial extends Trial {
  constructor({ requiredMarker }) {
    super();
    this.requiredMarker = requiredMarker;
  }
}
class CovidTrial extends Trial {}

class Region {}
class Europe extends Region {}
class USA extends Region {}


// ==== Dispatcher Setup ====

const eligibility = closDispatch();


// ==== Rules ====

eligibility.def(['Patient', 'Trial', '*'], () => false);

eligibility.def(['Patient', 'OncologyTrial', '*'], (p, trial) => {
  const required = trial.requiredMarker;
  return p.biomarkers?.[required] === 'positive';
});

eligibility.def(['Patient', 'CovidTrial', 'Europe'], (p) => {
  return p.risk !== 'high';
});

eligibility.def(['Patient', 'OncologyTrial', '*'], (p, trial) => {
  const marker = trial.requiredMarker;
  if (!(marker in (p.biomarkers || {}))) {
    console.warn(`!! Patient missing biomarker info for ${marker}`);
  }
}, ':before');

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


// ==== Base Test Cases ====

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

console.log(eligibility(alice, trial1, eu)); // true
console.log(eligibility(bob, trial1, eu));   // false
console.log(eligibility(bob, trial2, eu));   // false
console.log(eligibility(clara, trial2, eu)); // true


// ==== EXTENSION: Asia + NeuroTrial ====

class Asia extends Region {}
class NeuroTrial extends Trial {
  constructor({ requiresMRI }) {
    super();
    this.requiresMRI = requiresMRI;
  }
}

eligibility.def(['Patient', 'NeuroTrial', 'Asia'], (p, trial) => {
  return !trial.requiresMRI || p.biomarkers?.MRI === 'done';
});

eligibility.def(['Patient', 'NeuroTrial', 'Asia'], (p, trial) => {
  if (trial.requiresMRI && !('MRI' in (p.biomarkers || {}))) {
    console.warn(`!! Missing MRI data for neuro trial`);
  }
}, ':before');

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
  biomarkers: {},
  risk: 'medium'
});

const neuroMRI = new NeuroTrial({ requiresMRI: true });
const neuroNoMRI = new NeuroTrial({ requiresMRI: false });
const asia = new Asia();

console.log(eligibility(dave, neuroMRI, asia));     // true
console.log(eligibility(erin, neuroMRI, asia));     // false
console.log(eligibility(erin, neuroNoMRI, asia));   // true


/*
# Base Tests
1. eligibility(alice, trial1, eu) → true
- Alice has HER2 = positive, and the trial requires HER2 → eligible.
2. eligibility(bob, trial1, eu) → false
- Bob has HER2 = negative, so not eligible for HER2+ oncology trial.
3. eligibility(bob, trial2, eu) → false
- High-risk patients are excluded from COVID trials in Europe.
4. eligibility(clara, trial2, eu) → true
- Clara is low-risk → special override in :around.

⸻

# Extended Tests (Asia + NeuroTrial)
5. eligibility(dave, neuroMRI, asia) → true
- Dave has MRI = done and the trial requires it → eligible.
6. eligibility(erin, neuroMRI, asia)
→ warning + false
- !! Missing MRI data for neuro trial → this comes from the :before hook.
- Erin has no MRI biomarker, but it’s required → not eligible.
7. eligibility(erin, neuroNoMRI, asia) → true
- This trial does not require MRI, so Erin is eligible despite missing data.
*/
