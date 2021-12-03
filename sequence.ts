/* eslint-disable @typescript-eslint/no-this-alias */

/**
 * Are the two items equal?
 *
 * @param a - Current item
 * @param b - Previous item
 * @returns True if equal
 */
type equalityCallback<T> = (a: T, b: T) => boolean;
function eqeqeq<T>(a: T, b: T): boolean {
  return a === b;
}

/**
 * @param item - The item of the iterator to map
 * @param index - The index of the item in the iterator
 * @param sequence - The sequence being mapped
 * @returns The mapped value
 */
 type flatMapCallback<T, U>
   = (item: T, index: number, sequence: Sequence<T>) => U | Iterable<U>;

/**
 * @param item - The item of the iterator to filter.
 * @param index - The index of the item in the iterator.
 * @param sequence - The iterable being filtered.
 * @returns If true, this item is retained.
 */
type filterCallback<T> =
  (item: T, index: number, sequence: Sequence<T>) => boolean;

/**
 * @param item - The item of the iterator to map
 * @param index - The index of the item in the iterator
 * @param sequence - The sequence being mapped
 * @returns The mapped value
 */
type mapCallback<T, U> = (item: T, index: number, sequence: Sequence<T>) => U;

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

  //#region Type Checking
  /**
   * Is the given thing iterable?
   *
   * @param g - The thing to check.
   * @returns True if `g` looks like an iterable.
   */
  static isIterable<T>(g: any): g is Iterable<T> {
    return g
      && (typeof g === "object")
      && (typeof (g as Iterable<T>)[Symbol.iterator] === "function");
  }

  /**
   * Is this thing a sequence?
   *
   * @param s - Something that might be a Sequence
   * @returns True if it's a Sequence
   */
  static isSequence<T>(s: any): s is Sequence<T> {
    return s
      && (typeof s === "object")
      && s instanceof Sequence;
  }
  //#endregion Type Checking

  //#region Statics

  /**
   * Concatenate several sequences together.
   *
   * @param seqs - The input sequences
   * @returns A sequence with all of the items of each sequence in order.
   */
  static concat<T>(...seqs: Sequence<T>[]): Sequence<T> {
    return new Sequence({
      * [Symbol.iterator]() {
        for (const s of seqs) {
          yield* s;
        }
      }
    });
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
   * Yield the same value for ever.  And ever.
   * Value of VALUES! And Loop of LOOPS!
   *
   * @param val - The value to yield.
   * @returns A Sequence yielding val forever.
   */
  static forEver<U>(val: U): Sequence<U> {
    return new Sequence({
      * [Symbol.iterator]() {
        while (true) {
          yield val;
        }
      }
    });
  }

  /**
   * Cross product.  Translated from the python docs.
   *
   * @param seqs - Sequences to cross together.
   * @param repeat - Number of times to repeat the iterables.
   * @returns A generator yielding each of the combinations of the iterables.
   */
  static product<U>(seqs: Sequence<U>[], repeat = 1): Sequence<U[]> {
    return new Sequence({
      * [Symbol.iterator]() {
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
    });
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
    return new Sequence({
      * [Symbol.iterator]() {
        if (stop === undefined) {
          [start, stop] = [0, start];
        }
        if (step < 0) {
          for (let i = start; i > stop; i += step) {
            yield i;
          }
        } else {
          for (let i = start; i < stop; i += step) {
            yield i;
          }
        }
      }
    });
  }

  //#region Statics

  //#region Methods

  /**
   * Allow iteration over a Sequence.
   *
   * @returns Iterator instance.
   */
  [Symbol.iterator]() {
    return this.it[Symbol.iterator]();
  }

  /**
   * Return the Nth item of the sequence.
   *
   * @param n - Zero-based
   * @returns The Nth item, or undefined if sequence isn't long enough
   */
  at(n: number): T | undefined {
    let count = 0;
    for (const i of this.it) {
      if (count === n) {
        return i;
      }
      count++;
    }
    return undefined;
  }

  /**
   * Generate chunks of n items throughout the sequence.  If the sequence
   * length is not divisible by n, the last chunk will be of length greater
   * than zero but less than n.
   *
   * @param n - Size of each chunk
   * @returns Sequence of arrays of items
   */
  chunks(n: number): Sequence<T[]> {
    n |= 0;
    if (n < 1) {
      throw new RangeError("n must be greater than one");
    }
    const that = this;
    return new Sequence({
      * [Symbol.iterator]() {
        let res = new Array(n);
        let count = 0;
        for (const i of that.it) {
          res[count] = i;
          if (count === n - 1) {
            yield res;
            res = new Array(n);
            count = 0;
          } else {
            count++;
          }
        }
        // Anything left?
        if (count > 0) {
          res.splice(count);
          yield res;
        }
      }
    });
  }

  /**
   * Combinations of a series, r at a time
   *
   * @param r - How many of the series to use in each combination?
   * @returns A generator that yields each combination
   */
  combinations(r: number): Sequence<T[]> {
    const pool = this.toArraySequence();
    return new Sequence({
      * [Symbol.iterator]() {
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
    });
  }

  /**
   * Concatenate this sequence follwed by all of the input sequences.
   *
   * @param seqs - The other sequences
   * @returns A sequence with all of the items of each sequence in order,
   *   starting with this sequence.
   */
  concat(...seqs: Sequence<T>[]): Sequence<T> {
    return Sequence.concat(this, ...seqs);
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
   * Removes all but the first of consecutive elements in the vector
   * satisfying a given equality relation.
   *
   * @param fn - The equality relation, defaults to ===.
   * @returns Deduplicated sequence
   */
  dedup(fn: equalityCallback<T> = eqeqeq): Sequence<T> {
    const that = this;
    return new Sequence({
      * [Symbol.iterator]() {
        let first = true;
        let last;
        for (const i of that.it) {
          if (first) {
            first = false;
            yield i;
            last = i;
          } else if (!fn(i, last as T)) {
            yield i;
            last = i;
          }
        }
      }
    });
  }

  /**
   * Discard the first size elements of the sequence, and return an Sequence
   * with everything else.
   *
   * @param size - The number of elements to discard.
   * @returns A new Sequence
   */
  discard(size: number): Sequence<T> {
    const that = this;
    return new Sequence({
      [Symbol.iterator]() {
        const it = that.it[Symbol.iterator]();
        for (let i = 0; i < size; i++) {
          it.next();
        }
        return it;
      }
    });
  }

  /**
   * Creates a new sequence with the key/value pairs of the original sequence.
   *
   * @returns Sequence of [number, item] tuples
   */
  entries(): Sequence<[number, T]> {
    const that = this;
    return new Sequence({
      * [Symbol.iterator]() {
        let count = 0;
        for (const i of that.it) {
          yield [count++, i];
        }
      }
    });
  }

  /**
   * Does every item in the sequence fulfill some predicate?
   *
   * @param fn - The predictate
   * @param thisArg - Optional "this" for the predicate
   * @returns True if the predicate matches for all items
   */
  every(fn: filterCallback<T>, thisArg?: any): boolean {
    let count = 0;
    for (const i of this.it) {
      if (!fn.call(thisArg, i, count++, this)) {
        return false;
      }
    }
    return true;
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
    const that = this;
    return new Sequence({
      * [Symbol.iterator]() {
        let count = 0;
        for (const val of that.it) {
          if (fn.call(thisArg, val, count++, that)) {
            yield val;
          }
        }
      }
    });
  }

  /**
   * Return the first item of the sequence for which the function returns
   * true.
   *
   * @param fn - Function to call on each argument.
   * @param thisArg - Object to use as "this" in the callback function.
   * @returns The first match, or undefined.
   */
  find(fn: filterCallback<T>, thisArg?: any): T | undefined {
    let count = 0;
    for (const val of this.it) {
      if (fn.call(thisArg, val, count++, this)) {
        return val;
      }
    }
    return undefined;
  }

  /**
   * Find the index into the sequence for the first item that matches the
   * predicate.
   *
   * @param fn - Predicate to call on each argument.
   * @param thisArg - Object to use as "this" in the callback function.
   * @returns The index of the first match, or -1 if not found.
   */
  findIndex(fn: filterCallback<T>, thisArg?: any): number {
    let count = 0;
    for (const val of this.it) {
      if (fn.call(thisArg, val, count, this)) {
        return count;
      }
      count++;
    }
    return -1;
  }

  /**
   * Flatten the Sequence by up to depth times.  For this to make sense,
   * T must be at least sometimes-iterable (e.g. number|number[]).
   *
   * @param depth - Maximum depth to flatten.  Infinity is a valid option.
   * @returns A flattened sequence.
   */
  flat(depth = 1): Sequence<T> {
    function* f(s: Iterable<T>, d: number): Generator<T, void, undefined> {
      for (const i of s) {
        if ((d < depth) && Sequence.isIterable<T>(i)) {
          yield* f(i, d + 1);
        } else {
          yield i;
        }
      }
    }

    const that = this;
    return new Sequence({
      * [Symbol.iterator]() {
        yield* f(that.it, 0);
      }
    });
  }

  /**
   * Perform a map operation on the sequence, then flatten once.
   *
   * @param fn - Map from T to U or Iterable[U]
   * @param thisArg - "this" in the mapping function
   * @returns - A new sequence, with the mapped and flattend values.
   */
  flatMap<U>(fn: flatMapCallback<T, U>, thisArg?: any): Sequence<U> {
    // Map, then flatten.
    // Always pillage before you burn.
    const that = this;
    return new Sequence({
      * [Symbol.iterator](): Generator<U, void, undefined> {
        let c = 0;
        for (const item of that.it) {
          // Flatten to depth 1
          const res = fn.call(thisArg, item, c++, that);
          if (Sequence.isIterable(res)) {
            yield* res;
          } else {
            yield res;
          }
        }
      }
    });
  }

  /**
   * Create a string from the sequence, interspersing each element with a
   * separator.  Note that this can be infinitely-expensive for inifinite
   * sequences.
   *
   * @param separator - Separate each item.  Use "" if you don't want one.
   * @returns The joined string
   */
  join(separator = ","): string {
    let res = "";
    let first = true;
    for (const i of this.it) {
      if (first) {
        first = false;
      } else {
        res += separator;
      }
      res += String(i);
    }
    return res;
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
    const that = this;
    return new Sequence({
      * [Symbol.iterator]() {
        let c = 0;
        for (const item of that.it) {
          yield callable.call(thisArg, item, c++, that);
        }
      }
    });
  }

  /**
   * Cycle an iteable n times.
   *
   * @param n - The number of times to cycle through the input iterable
   * @returns A generator that yields each value from the iterable, cycled.
   */
  ncycle(n: number): Sequence<T> {
    const that = this;
    return new Sequence({
      * [Symbol.iterator]() {
        if (n <= 0) {
          // Nothing
        } else if (n === 1) {
          yield* that.it;
        } else {
          const buffer = [];
          for (const item of that.it) {
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
    });
  }

  /**
   * Yields all permutations of each possible choice of <code>r</code> elements
   * of the input iterable.
   *
   * @param r - The size of the permutations to generate.
   * @returns A generator that yields each permutation.
   */
  permutations(r: number): Sequence<T[]> {
    const pool = this.toArraySequence();
    return new Sequence({
      * [Symbol.iterator]() {
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
    });
  }

  /**
   * Pick some properties or array values out of `source`.
   *
   * @param it - The indexes
   * @returns A generator that yields the selected items
   */
  pick(it: Iterable<number>): Sequence<T> {
    const pool = this.toArray();
    return new Sequence({
      * [Symbol.iterator]() {
        // This is slower than it should be, but `it` might be out
        // of order, and so might `source`.

        for (const i of it) {
          yield pool[i];
        }
      }
    });
  }

  /**
   * Yields all possible subsets of the input, including the input itself
   * and the empty set.
   *
   * @param iterable - Input.
   * @returns A generator yielding each subset.
   */
  powerset(): Sequence<T[]> {
    const that = this;
    return new Sequence({
      * [Symbol.iterator]() {
        for (const len of Sequence.range(that.count() + 1)) {
          yield* that.combinations(len);
        }
      }
    });
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

  /**
   * Shallow-copy a portion of the sequence into a new sequence, from index
   * start (inclusive) to end (exclusive).
   *
   * @param start - Starting index.  If less than 0, count backward from the
   *   end, which causes buffering.
   * @param end - End index, defaults to the length of the sequence.  If less
   *   than 0 counts backwards from the end of the sequence.
   * @returns A new sequence with the selected items.
   */
  slice(start = 0, end?: number): Sequence<T> {
    const that = this;
    return new Sequence({
      * [Symbol.iterator]() {
        if (end === 0) {
          return;
        }
        const it = that.it[Symbol.iterator]();
        if (start < 0) {
          // Circular buffer up n entries, have to read all the way to the end
          // to ensure we've got them all.
          const n = -start;
          const buffer = new Array(n);
          let cur = 0;
          let len = 0;
          for (const value of that.it) {
            buffer[cur] = value;
            cur = (cur + 1) % n;
            len++;
          }
          if (end === undefined) {
            if (n <= len) {
              yield* buffer.slice(cur);
            }
            yield* buffer.slice(0, cur);
          } else {
            let left = 0;
            if (end > 0) {
              // Yield n - (len - end) items
              if (end > len) {
                end = len;
              }
              left = n - (len - end);
            } else {
              if (end < -len) {
                end = -len;
              }
              left = n + end;
            }
            if (left > 0) {
              const back = buffer.slice(cur, cur + left);
              left -= back.length;
              yield* back;
              if (left > 0) {
                yield* buffer.slice(0, left);
              }
            }
          }
        } else {
          // Discard the first start items
          for (let i = 0; i < start; i++) {
            if (it.next().done) {
              break;
            }
          }

          const stop = (end === undefined) ? Infinity : end;
          if (stop < 0) {
            // Circular buffer -end items, then discard the rest
            const buffer = new Array(-stop);
            let cur = 0;
            let left = -stop;
            let i = it.next();
            while (!i.done) {
              if (left > 0) {
                left--;
              } else {
                yield buffer[cur];
              }
              buffer[cur] = i.value;
              cur = (cur + 1) % -stop;
              i = it.next();
            }
          } else {
            let i = it.next();
            let count = start;
            while (!i.done && (count < stop)) {
              yield i.value;
              i = it.next();
              count++;
            }
          }
        }
      }
    });
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
  some(f: filterCallback<T>, thisArg?: any): boolean {
    let count = 0;
    for (const i of this.it) {
      if (f.call(thisArg, i, count++, this)) {
        return true;
      }
    }
    return false;
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

    // FIX: this sequence is not re-usable.
    return [ret, new Sequence<T>({
      [Symbol.iterator]: () => it
    })];
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
    const that = this;
    return new Sequence({
      * [Symbol.iterator]() {
        if (n === 0) {
          return;
        }

        if (n < 0) {
          yield* that.trunc(-n);
          return;
        }

        for (const val of that.it) {
          yield val;
          if (--n <= 0) {
            return;
          }
        }
      }
    });
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
   * Yields all elements of the iterable except the last <code>n</code> ones.
   * If <code>n</code> is negative, behaves like
   * <code>{@link take}(iterable, -n)</code>.
   *
   * @param n - Number of elements to exclude at the end
   * @returns A generator that yields the front of the input
   */
  trunc(n: number): Sequence<T> {
    const that = this;
    return new Sequence({
      * [Symbol.iterator]() {
        if (n < 0) {
          yield* that.take(-n);
          return;
        }

        if (n === 0) {
          yield* that.it;
          return;
        }

        // Circular buffer up n entries, then serve old ones as we go
        const buffer = new Array(n);
        let cur = 0;
        let left = n;
        for (const value of that.it) {
          if (left > 0) {
            left--;
          } else {
            yield buffer[cur];
          }
          buffer[cur] = value;
          cur = (cur + 1) % n;
        }
      }
    });
  }

  /**
   * A sliding window of N items over the sequence.
   *
   * @param size - The number of items in each sequence.
   * @returns A new sequence that generates each window
   */
  windows(size: number): Sequence<T[]> {
    const that = this;
    return new Sequence({
      * [Symbol.iterator]() {
        const [buf, it] = that.split(size);
        yield buf;
        for (const t of it) {
          buf.shift();
          buf.push(t);
          yield buf;
        }
      }
    });
  }

  //#endregion Methods
}
