// clos-dispatch.js

export function closDispatch() {
  const methods = new Map();

  function keyFor(selector, qualifier = ':primary') {
    if (!Array.isArray(selector)) {
      throw new Error('Selector must be an array of types');
    }
    return JSON.stringify({ selector, qualifier });
  }

  function resolveKey(keys, objTypes) {
    // Rank by specificity: number of exact class matches (not '*')
    const ranked = keys
      .map((k) => ({ key: k, parsed: JSON.parse(k) }))
      .filter(({ parsed }) => {
        const sel = parsed.selector;
        return sel.length === objTypes.length && sel.every((type, i) => type === '*' || type === objTypes[i]);
      })
      .sort((a, b) => {
        const score = (s) => s.parsed.selector.filter((t) => t !== '*').length;
        return score(b) - score(a); // more specific first
      });

    return ranked.map((r) => r.key);
  }

  function dispatcher(...args) {
    const types = args.map((x) => x?.constructor?.name ?? typeof x);

    const allKeys = [...methods.keys()];
    const primaries = resolveKey(
      allKeys.filter((k) => JSON.parse(k).qualifier === ':primary'),
      types
    );

    const key = primaries[0];
    if (!key) {
      throw new Error(`No primary method found for (${types.join(', ')})`);
    }

    const befores = resolveKey(
      allKeys.filter((k) => JSON.parse(k).qualifier === ':before'),
      types
    );
    for (const k of befores.reverse()) {
      methods.get(k)(...args);
    }

    const arounds = resolveKey(
      allKeys.filter((k) => JSON.parse(k).qualifier === ':around'),
      types
    );

    let final = () => methods.get(key)(...args);
    for (const k of arounds) {
      const prev = final;
      final = () => methods.get(k)(prev, ...args);
    }

    const result = final();

    const afters = resolveKey(
      allKeys.filter((k) => JSON.parse(k).qualifier === ':after'),
      types
    );
    for (const k of afters) {
      methods.get(k)(...args);
    }

    return result;
  }

  dispatcher.def = function(selector, fn, qualifier = ':primary') {
    const key = keyFor(selector, qualifier);
    if (methods.has(key)) {
      throw new Error(`Method already defined for ${key}`);
    }
    methods.set(key, fn);
    return dispatcher;
  };

  return dispatcher;
}
