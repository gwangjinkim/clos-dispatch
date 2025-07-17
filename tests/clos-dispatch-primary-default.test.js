// tests/clos-dispatch-primary-default.test.js

import { closDispatch } from '../src/clos-dispatch.js';

// Domain types
class Dog {}
class Cat {}
class Animal {}

console.log("\n=== Basic Primary Behavior ===");

const greet = closDispatch();

// Define methods using .def()
greet.def(['Dog'], () => "Woof! (implicit)");
greet.def(['Cat'], () => "Meow! (implicit)");
greet.def(['Animal'], () => "Generic animal sound", ':primary');

console.assert(greet(new Dog()) === "Woof! (implicit)", "X Dog greeting failed");
console.assert(greet(new Cat()) === "Meow! (implicit)", "X Cat greeting failed");
console.assert(greet(new Animal()) === "Generic animal sound", "X Animal fallback failed");

console.log("OK Primary dispatch tests passed");


// === Add side-effecting methods to observe order ===

console.log("\n=== :before and :after Method Combination ===");

let log = [];

greet.def(['Dog'], () => log.push("Before Dog"), ':before');
greet.def(['Dog'], () => log.push("After Dog"), ':after');

let result = greet(new Dog());
console.assert(result === "Woof! (implicit)", "X greet Dog with before/after failed");
console.assert(log.join(' | ') === "Before Dog | After Dog", "X Order mismatch: " + log.join(' | '));

console.log("OK :before and :after order correct");


// === Wrap with :around ===

console.log("\n=== :around Wrapping and callNext ===");

log = [];

greet.def(['Dog'], (callNext, a) => {
  log.push("Around Start");
  const result = callNext(a);
  log.push("Around End");
  return `${result}`;
}, ':around');

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
