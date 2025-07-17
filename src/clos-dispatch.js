// src/clos-dispatch.js

function getTypeName(value) {
  return value?.constructor?.name ?? typeof value;
}

function typeKey(types) {
  return types.map(getTypeName).join("|");
}

function parseKey(key) {
  // Expect key to be in form [typesArray, methodType]
  if (!Array.isArray(key) || key.length !== 2) throw new Error("Invalid method registration key");
  return [key[0], key[1]];
}

function defaultPolicy(methods) {
  return methods[methods.length - 1]; // last-wins
}

export function closDispatch() {
  const methodTable = new Map();

  function register(types, kind, fn) {
    const key = typeKey(types);
    if (!methodTable.has(key)) methodTable.set(key, {});
    const entry = methodTable.get(key);
    if (!entry[kind]) entry[kind] = [];
    entry[kind].push(fn);
  }

  function findApplicable(args) {
    const key = typeKey(args);
    const exact = methodTable.get(key);
    if (exact) return exact;
    return null;
  }

  function dispatch(...args) {
    const applicable = findApplicable(args);
    if (!applicable) throw new Error("No matching method for given types: " + typeKey(args));

    const run = () => {
      for (const before of applicable[':before'] ?? []) before(...args);

      const primary = (applicable[':primary'] ?? []).slice(-1)[0];
      if (!primary) throw new Error("No :primary method defined");

      const result = primary(...args);

      for (const after of (applicable[':after'] ?? []).slice().reverse()) after(...args);

      return result;
    };

    const arounds = applicable[':around'] ?? [];
    const composed = arounds.reduceRight(
      (next, fn) => (...a) => fn(() => next(...a), ...a),
      run
    );

    return composed(...args);
  }

  // Proxy to allow fn[[types], method] = handler syntax
  const fn = new Proxy(dispatch, {
    set(target, key, value) {
      let types, kind;
      if (Array.isArray(key) && key.length === 2) {
        [types, kind] = key;
      } else if (Array.isArray(key)) {
        types = key;
        kind = ':primary'; // default fallback
      } else {
        throw new Error("Invalid method registration key");
      }
      register(types, kind, value);
      return true;
    }
  });

  return fn;
}
