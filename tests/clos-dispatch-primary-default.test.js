// tests/clos-dispatch-primary-default.test.js

import { closDispatch } from '../src/clos-dispatch.js';

// Domain types
class Dog {}
class Cat {}
class Animal {}

console.log("\n=== Basic Primary Behavior ===");

const greet = closDispatch();

// Implicit :primary methods (no :primary needed for default usage)
greet[[['Dog']]] = () => "Woof! (implicit)";
greet[[['Cat']]] = () => "Meow! (implicit)";

console.assert(greet(new Dog()) === "Woof! (implicit)", "X Dog greeting failed");
console.assert(greet(new Cat()) === "Meow! (implicit)", "X Cat greeting failed");

// Fallback for superclass
greet[[['Animal'], ':primary']] = () => "Generic animal sound";
console.assert(greet(new Animal()) === "Generic animal sound", "X Animal fallback failed");

console.log("OK Primary dispatch tests passed");



// === Add side-effecting methods to observe order ===

console.log("\n=== :before and :after Method Combination ===");

let log = [];

greet[[['Dog'], ':before']] = () => log.push("Before Dog");
greet[[['Dog'], ':after']]  = () => log.push("After Dog");

let result = greet(new Dog());
console.assert(result === "Woof! (implicit)", "X greet Dog with before/after failed");
console.assert(log.join(' | ') === "Before Dog | After Dog", "X Order mismatch: " + log.join(' | '));

console.log("OK :before and :after order correct");



// === Wrap with :around ===

console.log("\n=== :around Wrapping and callNext ===");

log = [];

greet[[['Dog'], ':around']] = (callNext, a) => {
  log.push("Around Start");
  const result = callNext(a);
  log.push("Around End");
  return `${result}`;
};

result = greet(new Dog());
console.assert(result === "Woof! (implicit)", "X Around failed to wrap");
console.assert(log.join(' | ') === "Around Start | Before Dog | After Dog | Around End", "X Around order incorrect: " + log.join(' | '));

console.log("OK :around wrapping works");



// === Error case ===

console.log("\n=== Error Case: Unknown Types ===");

try {
  greet(42); // primitive, no class match
  console.assert(false, "Should have thrown an error for unknown type");
} catch (e) {
  console.log("OK Caught expected error:", e.message);
}
