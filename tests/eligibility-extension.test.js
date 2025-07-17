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
