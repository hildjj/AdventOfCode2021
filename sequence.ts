/**
 * @param item - The item of the iterator to check.
 * @param index - The index of the item in the iterator.
 * @returns Does this item match?
 */
type someCallback<T>
  = (item: T, index: number, sequence: Sequence<T>) => boolean;

/**
 * @param item - The item of the iterator to map
 * @param index - The index of the item in the iterator
 * @returns The mapped value
 */
type mapCallback<T, U> = (item: T, index: number, sequence: Sequence<T>) => U;

/**
  * @param item - The item of the iterator to filter.
  * @param index - The index of the item in the iterator.
  * @param iterable - The iterable being filtered.
  * @returns If true, this item is retained.
  */
type filterCallback<T> =
  (item: T, index: number, sequence: Sequence<T>) => boolean;

/**
  * @param accumulator - The value previously returned from the
  *   callback, starting with the initializer
  * @param item - The item of the iterator to process
  * @param index - The index of the item in the iterator
  * @returns The next value of the accumulator
  */
type reduceCallback<T, A>
  = (accumulator: A, item: T, index: number, sequence: Sequence<T>) => A;

/**
 * Lazy sequences, based on generators and iterators.
 *
 * The more interesting functions were lifted from lifted from
 * https://github.com/aureooms/js-itertools, to translate to TS
 * and avoid the need for a runtime.
 */
export default class Sequence<T> {
  it: Iterable<T>;

  /**
   * Creates an instance of Sequence.
   *
   * @param iterable - The iterable to wrap.
   */
  constructor(iterable: Iterable<T>) {
    this.it = iterable;
  }

  /**
   * Is the given thing iterable?
   *
   * @param g - The thing to check.
   * @returns True if `g` looks like an iterable.
   */
  static isIterable(g: any): boolean {
    return g && (typeof g === "object") && (typeof g[Symbol.iterator] === "function");
  }

  /**
   * Like Python's range(), generate a series of numbers.
   *
   * @param start - The starting point
   * @param stop - The ending point, which isn't reached
   * @param step - How much to add each time, may be negative
   * @returns A generator that yields each number in the range
   */
  static range(start: number, stop?: number, step = 1): Sequence<number> {
    function* f(): Generator<number, void, undefined> {
      // eslint-disable-next-line eqeqeq, no-eq-null
      if (stop == null) {
        [start, stop] = [0, start];
      }
      if (step < 0) {
        while (start > stop) {
          yield start;
          start += step;
        }
      } else {
        while (start < stop) {
          yield start;
          start += step;
        }
      }
    }
    return new Sequence(f());
  }

  /**
   * Cross product.  Translated from the python docs.
   *
   * @param seqs - Sequences to cross together.
   * @param repeat - Number of times to repeat the iterables.
   * @returns A generator yielding each of the combinations of the iterables.
   */
  static product<U>(seqs: Sequence<U>[], repeat = 1): Sequence<U[]> {
    function* f(): Generator<U[], void, undefined> {
      const aseqs: U[][] = seqs.map<U[]>(s => s.toArray());
      const pools = new Sequence(aseqs).ncycle(repeat);
      let result: U[][] = [[]];
      for (const pool of pools) {
        const r2: U[][] = [];
        for (const x of result) {
          for (const y of pool) {
            r2.push(x.concat(y));
          }
          result = r2;
        }
      }
      yield* result;
    }
    return new Sequence<U[]>(f());
  }

  /**
   * Yield the same value for ever.  And ever.
   * Value of VALUES! And Loop of LOOPS!
   *
   * @param val - The value to yield.
   * @returns A Sequence yielding val forever.
   */
  static forEver<U>(val: U): Sequence<U> {
    function* f(): Generator<U, void, undefined> {
      while (true) {
        yield val;
      }
    }
    return new Sequence(f());
  }

  /**
   * Are two sequences equal?  They are if all of their members are `===`.
   *
   * @param a - First Sequence.
   * @param b - Second Sequence.
   * @returns True if sequences are equal.
   */
  static equal<U>(a: Sequence<U>, b: Sequence<U>): boolean {
    if (a === b) {
      return true;
    }

    const it_a = a[Symbol.iterator]();
    const it_b = b[Symbol.iterator]();

    let ret = true;
    while (ret) {
      const n_a = it_a.next();
      const n_b = it_b.next();
      ret = (n_a.done === n_b.done) && (n_a.value === n_b.value);
      if (n_a.done || n_b.done) {
        break;
      }
    }
    return ret;
  }

  /**
   * If the Sequence isn't already an array, turn it into one.
   * Could be infinitely-costly for an infinite sequence.
   *
   * @returns Sequence coverted to Array
   */
  toArray(): any[] {
    return Array.isArray(this.it) ? this.it : [...this.it];
  }

  /**
   * Transform the iterator inside the sequence into an Array.
   * No-op if the iterator is already an Array.
   *
   * @returns Possibly new Sequence, where the iterator is an Array.
   */
  toArraySequence(): Sequence<T> {
    return Array.isArray(this.it) ? this : new Sequence([...this.it]);
  }

  /**
   * Allow iteration over a Sequence.
   *
   * @returns Iterator instance.
   */
  [Symbol.iterator]() {
    return this.it[Symbol.iterator]();
  }

  /**
   * Tests whether at least one element generated by the iterator passes the
   * test implemented by the provided function.
   *
   * @param it - The iterator. It may not be fully
   *   consumed.
   * @param f - The predicate.
   * @param thisArg - What is `this` in the function `f`?
   * @returns The predicate matched one of the items in the iterator.
   */
  some(f: someCallback<T>, thisArg?: any): boolean {
    let count = 0;
    for (const i of this.it) {
      if (f.call(thisArg, i, count++, this)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Yields all possible subsets of the input, including the input itself
   * and the empty set.
   *
   * @param iterable - Input.
   * @returns A generator yielding each subset.
   */
  powerset(): Sequence<T[]> {
    function* f(this: Sequence<T>) {
      for (const len of Sequence.range(this.count() + 1)) {
        yield* this.combinations(len);
      }
    }
    return new Sequence(f.call(this));
  }

  /**
   * Filter the iterable by a function.  If the function returns true,
   * the given value is yielded.  This should be a pretty big win over
   * `[...iterable].filter(fn)`.
   *
   * @param fn - Function called for every item in iterable.
   * @param thisArg - Value to use as `this` in the filterCallback.
   * @returns A generator that yields iterable values that match.
   */
  filter(fn: filterCallback<T>, thisArg?: any): Sequence<T> {
    function* f(this: Sequence<T>): Generator<T, void, undefined> {
      let count = 0;
      for (const val of this.it) {
        if (fn.call(thisArg, val, count++, this)) {
          yield val;
        }
      }
    }
    return new Sequence(f.call(this));
  }

  /**
   * Discard the first size elements of the sequence, and return an Sequence
   * with everything else.
   *
   * @param size - The number of elements to discard.
   * @returns A new Sequence
   */
  discard(size: number): Sequence<T> {
    function* f(this: Sequence<T>): Generator<T, void, undefined> {
      const it = this.it[Symbol.iterator]();
      for (let i = 0; i < size; i++) {
        it.next();
      }
      yield* {
        [Symbol.iterator]: () => it
      };
    }
    return new Sequence(f.call(this));
  }

  /**
   * Split a sequence into the first N items, and a sequence of the rest
   * of the elements.  If there aren't N items in the sequence, the array
   * will be short and the Sequence's iterator will be exhausted.
   *
   * @param size - How many items to put in the array.
   * @returns A tuple of an array of size.
   */
  split(size: number): [T[], Sequence<T>] {
    const it = this.it[Symbol.iterator]();
    const ret: T[] = [];
    for (let i = 0; i < size; i++) {
      const n = it.next();
      if (n.done) {
        break;
      }
      ret.push(n.value);
    }
    return [ret, new Sequence<T>({
      [Symbol.iterator]: () => it
    })];
  }

  /**
   * A sliding window of N items over the sequence.
   *
   * @param size - The number of items in each sequence.
   * @returns A new sequence that generates each window
   */
  windows(size: number): Sequence<T[]> {
    function* f(this: Sequence<T>): Generator<T[], void, undefined> {
      const [buf, it] = this.split(size);
      yield buf;
      for (const t of it) {
        buf.shift();
        buf.push(t);
        yield buf;
      }
    }
    return new Sequence(f.call(this));
  }

  /**
   * Return the number of items in the sequence.  Optimizations for arrays,
   * sets, and maps.
   *
   * @returns The number of items.
   */
  count(): number {
    if (Array.isArray(this.it)) {
      return this.it.length;
    }
    if (this.it instanceof Map || this.it instanceof Set) {
      return this.it.size;
    }

    let count = 0;
    for (const _ of this.it) {
      count++;
    }
    return count;
  }

  /**
   * Pick some properties or array values out of `source`.
   *
   * @param it - The indexes
   * @returns A generator that yields the selected items
   */
  pick(it: Iterable<number>): Sequence<T> {
    function* f(this: Sequence<T>): Generator<T, void, undefined> {
      // This is slower than it should be, but `it` might be out
      // of order, and so might `source`.
      const pool = this.toArray();
      for (const i of it) {
        yield pool[i];
      }
    }
    return new Sequence(f.call(this));
  }

  /**
   * Combinations of a series, r at a time
   *
   * @param r - How many of the series to use in each combination?
   * @returns A generator that yields each combination
   */
  combinations(r: number): Sequence<T[]> {
    function* f(this: Sequence<T>): Generator<T[], void, undefined> {
      const pool = this.toArraySequence();
      const length = pool.count();

      if (r > length) {
        return;
      }

      const indices = [...Sequence.range(r)];
      yield [...pool.pick(indices)];

      while (true) {
        let i = r - 1;
        while (i >= 0) {
          if (indices[i] !== i + length - r) {
            let pivot = ++indices[i];
            for (++i; i < r; ++i) {
              indices[i] = ++pivot;
            }
            break;
          }
          i--;
        }

        if (i < 0) {
          return;
        }

        yield [...pool.pick(indices)];
      }
    }
    return new Sequence(f.call(this));
  }

  /**
   * Yields all elements of the iterable except the last <code>n</code> ones.
   * If <code>n</code> is negative, behaves like
   * <code>{@link take}(iterable, -n)</code>.
   *
   * @param n - Number of elements to exclude at the end
   * @returns A generator that yields the front of the input
   */
  trunc(n: number): Sequence<T> {
    function* f(this: Sequence<T>): Generator<T, void, undefined> {
      if (n < 0) {
        yield* this.take(-n);
        return;
      }

      if (n === 0) {
        yield* this.it;
        return;
      }

      // Buffer up n entries, then serve old ones as we go
      const buffer = new Array(n);
      let cur = 0;
      let left = n;
      for (const value of this.it) {
        if (left > 0) {
          left--;
        } else {
          yield buffer[cur];
        }
        buffer[cur] = value;
        cur = (cur + 1) % n;
      }
    }
    return new Sequence(f.call(this));
  }

  /**
   * Yields the first <code>n</code> elements of the input iterable. If
   * <code>n</code> is negative, behaves like
   * <code>{@link trunc}(iterable, -n)</code>.
   *
   * @param n - The number of elements to include in the output.
   * @returns A generator that yields the front of the input
   */
  take(n: number): Sequence<T> {
    function* f(this: Sequence<T>): Generator<T, void, undefined> {
      if (n === 0) {
        return;
      }

      if (n < 0) {
        yield* this.trunc(-n);
        return;
      }

      for (const val of this.it) {
        yield val;
        if (--n <= 0) {
          return;
        }
      }
    }
    return new Sequence(f.call(this));
  }

  /**
   * Yields all permutations of each possible choice of <code>r</code> elements
   * of the input iterable.
   *
   * @param r - The size of the permutations to generate.
   * @returns A generator that yields each permutation.
   */
  permutations(r: number): Sequence<T[]> {
    function* f(this: Sequence<T>): Generator<T[], void, undefined> {
      const pool = this.toArraySequence();
      const length = pool.count();

      if (r > length || r <= 0 || length === 0) {
        return;
      }

      const indices = [...Sequence.range(length)];
      const cycles = [...Sequence.range(length, length - r, -1)];

      yield [...pool.pick(indices.slice(0, r))];

      while (true) {
        let i = r;

        while (i--) {
          --cycles[i];

          if (cycles[i] === 0) {
            // Could be costly
            indices.push(indices.splice(i, 1)[0]);

            cycles[i] = length - i;
          } else {
            const j = cycles[i];
            [indices[i], indices[length - j]]
              = [indices[length - j], indices[i]];
            yield [...pool.pick(indices.slice(0, r))];
            break;
          }
        }

        if (i === -1) {
          return;
        }
      }
    }
    return new Sequence(f.call(this));
  }

  /**
   * Cycle an iteable n times.
   *
   * @param n - The number of times to cycle through the input iterable
   * @returns A generator that yields each value from the iterable, cycled.
   */
  ncycle(n: number): Sequence<T> {
    function* f(this: Sequence<T>): Generator<T, void, undefined> {
      if (n <= 0) {
        // Nothing
      } else if (n === 1) {
        yield* this.it;
      } else {
        const buffer = [];
        for (const item of this.it) {
          yield item;
          buffer.push(item);
        }

        if (buffer.length === 0) {
          return;
        }

        while (--n > 0) {
          yield* buffer;
        }
      }
    }
    return new Sequence(f.call(this));
  }

  /**
   * Map a function across all of the items in an iterable.
   *
   * @param callable - The mapping function
   * @param iterable - Source to map from
   * @param thisArg - Optional "this" inside of the callable
   * @returns A generator that yields the mapped values
   */
  map<U>(callable: mapCallback<T, U>, thisArg?: any): Sequence<U> {
    function* f(this: Sequence<T>): Generator<U, void, undefined> {
      let c = 0;
      for (const item of this.it) {
        yield callable.call(thisArg, item, c++, this);
      }
    }
    return new Sequence<U>(f.call(this));
  }

  /**
   * Repeatedly execute a reducer callback for each item in the iterable,
   * resulting in a single output value.
   *
   * @param callback - Function to call for each item in the iterable
   * @param iterable - Series to pull from
   * @param initializer - Initial value.  If none is provided, use the
   *   first item in the iterable (like `Array.prototype.reduce()`).
   * @returns The result of the last call to the callback on the
   *   last item
   * @throws {@link TypeError} Iterable is empty and there is no initializer
   */
  reduce<A>(callback: reduceCallback<T, A>, initializer?: A): A {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    let iterable: Sequence<T> = this;
    if (initializer === undefined) {
      // No initializer?  Use the first item in the iterable
      const [first, s] = this.split(1);

      if (first.length === 0) {
        throw new TypeError("Empty iterable and no initializer");
      }
      initializer = first[0] as unknown as A;
      iterable = s;
    }

    let count = 0;
    for (const item of iterable) {
      initializer = callback(initializer, item, count++, this);
    }

    return initializer;
  }
}
