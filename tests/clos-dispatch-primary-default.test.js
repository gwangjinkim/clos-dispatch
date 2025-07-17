// tests/clos-dispatch-primary-default.test.js


/*
What It Covers:
- Implicit :primary registration
- Mixing implicit and explicit methods
- Execution order with :before, :after, :around
- callNext() usage
- Error handling for unknown types
*/



import { closDispatch } from '../src/clos-dispatch.js';

class Dog {}
class Cat {}
class Animal {}

console.log("=== Primary Default Behavior Tests ===");

const greet = closDispatch();

// Implicit :primary
console.log("\n-- Registering implicit :primary --");
greet[[['Dog']]] = () => "Woof! (implicit)";
greet[[['Cat']]] = () => "Meow! (implicit)";

console.assert(greet(new Dog()) === "Woof! (implicit)", "Dog greeting failed");
console.assert(greet(new Cat()) === "Meow! (implicit)", "Cat greeting failed");

// Mixing explicit :primary and implicit :primary
console.log("\n-- Mixing explicit and implicit --");
greet[[['Animal'], ':primary']] = () => "Generic animal sound";
console.assert(greet(new Animal()) === "Generic animal sound", "Animal greeting failed");

// Add :before and :after
console.log("\n-- With :before and :after --");
greet[[['Dog'], ':before']] = () => console.log("🐶 Dog is sniffing...");
greet[[['Dog'], ':after']] = () => console.log("🐾 Dog walks away.");

console.log(greet(new Dog()));

// Add :around method
console.log("\n-- With :around wrapping --");
greet[[['Dog'], ':around']] = (callNext, a) => {
  console.log("✨ Preparing to greet...");
  const result = callNext(a);
  console.log("✨ Greeting done.");
  return result;
};

console.log(greet(new Dog()));

// Test fallback error handling
console.log("\n-- Error for unknown type --");
try {
  greet(42);
} catch (e) {
  console.log("Caught expected error:", e.message);
}
