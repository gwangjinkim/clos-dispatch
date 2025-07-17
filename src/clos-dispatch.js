// clos-dispatch.js
// Elegant multiple dispatch for JavaScript with CLOS-style method combinations

export function closDispatch() {
  const methods = [];

  function getClassName(obj) {
    if (obj === null || obj === undefined) return '*';
    return obj.constructor?.name || typeof obj;
  }

  function getPrototypeChain(cls) {
    const chain = [];
    while (cls && cls.name) {
      chain.push(cls.name);
      cls = Object.getPrototypeOf(cls);
    }
    return chain;
  }

  function* expandTypes(objs) {
    const chains = objs.map(obj => getPrototypeChain(obj?.constructor || Object));
    const total = chains.length;

    function* recurse(path = [], depth = 0) {
      if (depth === total) {
        yield path;
        return;
      }
      for (const name of chains[depth]) {
        yield* recurse([...path, name], depth + 1);
      }
      yield* recurse([...path, '*'], depth + 1);
    }

    yield* recurse();
  }

  function call(...args) {
    const key = args.map(getClassName);

    const candidates = methods
      .filter(([pattern]) => pattern.length === key.length)
      .filter(([pattern]) => pattern.every((t, i) => t === '*' || t === key[i]))
      .sort((a, b) => {
        const aScore = a[0].filter(t => t !== '*').length;
        const bScore = b[0].filter(t => t !== '*').length;
        return bScore - aScore;
      });

    const arounds = methods.filter(([pattern, type]) => type === ':around' && pattern.length === args.length)
      .sort((a, b) => {
        const aScore = a[0].filter(t => t !== '*').length;
        const bScore = b[0].filter(t => t !== '*').length;
        return bScore - aScore;
      });

    let callNext = () => {
      for (const [pattern, , fn] of candidates) {
        if (pattern.every((t, i) => t === '*' || t === key[i])) {
          return fn(...args);
        }
      }
      throw new Error('No applicable method found');
    };

    for (const [pattern, , fn] of arounds) {
      if (pattern.every((t, i) => t === '*' || t === key[i])) {
        const prev = callNext;
        callNext = () => fn(prev, ...args);
      }
    }

    const befores = methods.filter(([pattern, type]) => type === ':before' && pattern.length === args.length);
    for (const [pattern, , fn] of befores) {
      if (pattern.every((t, i) => t === '*' || t === key[i])) {
        fn(...args);
      }
    }

    const result = callNext();

    const afters = methods.filter(([pattern, type]) => type === ':after' && pattern.length === args.length);
    for (const [pattern, , fn] of afters) {
      if (pattern.every((t, i) => t === '*' || t === key[i])) {
        fn(...args);
      }
    }

    return result;
  }

  return new Proxy(call, {
    set(_, key, value) {
      if (typeof key === 'symbol') return false;
      const parsed = JSON.parse(key);
      if (!Array.isArray(parsed)) throw new Error("Invalid method registration key");
      const type = parsed.length > 1 && typeof parsed[1] === 'string' && parsed[1].startsWith(':') ? parsed[1] : ':primary';
      const pattern = parsed[0];
      methods.push([pattern, type, value]);
      return true;
    },
    get(target, prop) {
      if (prop === 'add') {
        return (types, fn, kind = ':primary') => {
          methods.push([types, kind, fn]);
        };
      }
      return target[prop];
    }
  });
}

