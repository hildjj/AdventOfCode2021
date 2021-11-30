import * as fs from "fs";
import * as path from "path";
import * as peggy from "peggy";
import url from "url";
import util from "util";

function getStack(_: Error, stack: NodeJS.CallSite[]): NodeJS.CallSite[] {
  return stack;
}

interface mainParams {
  /** All args */
  args: string[];
  /** Flags prefixed with "--". "--trace" is always supported */
  flags: string[];
  /** Non-flag args.  First param is input file. */
  params: string[];
}

/**
 * @param inputFile - The input file to parse, or the default.
 * @param trace - Do parser tracing?
 * @param params - The command line, as `{args, flags, params}`.
 * @returns Does this item match?
 */
type mainCallback =
  (inputFile: string, trace: boolean, params: mainParams) => any;

/**
 * @param item - The item of the iterator to check.
 * @param index - The index of the item in the iterator.
 * @returns Does this item match?
 */
type itSomeCallback<T> = (item: T, index: number) => boolean;

/**
 * @param item - The item of the iterator to map
 * @param index - The index of the item in the iterator
 * @returns The mapped value
 */
type mapCallback<T> = (item: T, index: number) => any;

/**
 * @param item - The item of the iterator to filter.
 * @param index - The index of the item in the iterator.
 * @param iterable - The iterable being filtered.
 * @returns If true, this item is retained.
 */
type filterCallback<T> =
  (item: T, index: number, iterable: Iterable<T>) => boolean;

/**
 * @param accumulator - The value previously returned from the
 *   callback, starting with the initializer
 * @param item - The item of the iterator to process
 * @param index - The index of the item in the iterator
 * @returns The next value of the accumulator
 */
type reduceCallback<T, A> = (accumulator: A, item: T, index: number) => A;

/**
 * Utility functions.
 */
export default class Utils {
  /**
   * Wrapper for main, so that it only gets called if the module hasn't been
   * required (eg when jest tests are being run).  Prints the return from
   * mainFunc.
   *
   * @param metaUrl - From the calling file, import.meta.url
   * @param mainFunc - The function to call if main
   * @example
   * Utils.main(import.meta.url, main)
   */
  static main(metaUrl: string, mainFunc: mainCallback) {
    const arg = process.argv[1];
    const argExt = path.extname(arg);
    const meta = url.fileURLToPath(metaUrl);
    if ((argExt && (meta === arg)) || (this._stripExt(meta) === arg)) {
      const args = process.argv.slice(2);
      const [flags, params] = args.reduce<[string[], string[]]>((t, v) => {
        t[v.startsWith("--") ? 0 : 1].push(v);
        return t;
      }, [[], []]);
      const [inputFile] = params;
      const trace = flags.indexOf("--trace") >= 0;
      const res = mainFunc(inputFile, trace, { args, flags, params });
      console.log(util.inspect(res, {
        colors: process.stdout.isTTY,
        depth: Infinity,
        maxArrayLength: Infinity,
        maxStringLength: Infinity,
      }));
    }
  }

  static _stripExt(p: string): string {
    const ext = path.extname(p);
    return ext ? p.slice(0, -ext.length) : p;
  }

  /**
   * Read file, parse lines.
   *
   * @param filename - If null, figures out what day today is
   *   and finds the .txt file.
   * @returns One entry per line.
   */
  static readLines(filename?: string): string[] {
    if (!filename) {
      // Like s/.js$/.txt/ from the calling file.
      filename = this._adjacentFile(".txt", "inputs");
    }
    return fs.readFileSync(filename, "utf8")
      .split("\n")
      .filter(s => s.length);
  }

  /**
   * Parse a file.
   *
   * @param filename - If null, figures out what day today is
   *   and finds the .txt file.
   * @param parser - If a string, the name of the parser
   *   file to require.  If a function, the pre-required parser.  If null,
   *   find the parser with the matching name. If no parser found, split
   *   like `readLines`.
   * @param trace - Turn on parser tracing?
   * @returns The output of the parser.
   */
  static parseFile(
    filename?: string,
    parser?: string | ((input: string, options?: peggy.ParserOptions) => any),
    trace = false
  ): any {
    if (!filename) {
      filename = this._adjacentFile(".txt", "inputs");
    }
    const txt = fs.readFileSync(filename, "utf8");

    // @type {function}
    let parserFunc = null;
    if (typeof parser === "function") {
      parserFunc = parser;
    } else {
      const parserFile = parser ?? this._adjacentFile(".peggy");
      const parserText = fs.readFileSync(parserFile, "utf8");
      parserFunc = peggy.generate(parserText, { trace }).parse;
    }
    return parserFunc(txt);
  }

  /**
   * @returns The file with the given extension next to the calling file.
   */
  static _adjacentFile(ext: string, ...dir: string[]): string {
    // Idiomatic tcl
    const callerFile = this.callsites()[2].getFileName();
    if (!callerFile) {
      throw new Error("No caller file name");
    }
    const p = path.parse(callerFile);
    return path.join(p.dir, ...dir, p.name + ext);
  }

  static callsites(): NodeJS.CallSite[] {
    const old = Error.prepareStackTrace;
    Error.prepareStackTrace = getStack;
    const stack = (new Error().stack as unknown as NodeJS.CallSite[]).slice(1); // I am never interesting
    Error.prepareStackTrace = old;
    return stack;
  }

  /**
   * Modulo, minus the JS bug with negative numbers.
   * `-5 % 4` should be `3`, not `-1`.
   *
   * @param x - Divisor.
   * @param y - Dividend.
   * @returns Result of x mod y.
   * @throws {@link Error} Division by zero.
   */
  static mod<T extends number | bigint>(x: T, y: T): T {
    // == works with either 0 or 0n.
    // eslint-disable-next-line eqeqeq
    if (y == 0) {
      throw new Error("Division by zero");
    }
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore: TS2365.  tsc can't see that x and y are always the same type
    return ((x % y) + y) % y;
  }

  /**
   * Integer result of x / y, plus the modulo (unsigned) remainder.
   *
   * @param x - Divisor.
   * @param y - Dividend.
   * @returns The quotient and remainder.
   */
  static divmod<T extends number | bigint>(x: T, y: T): [T, T] {
    let q = (x / y) as unknown as T;
    const r: T = this.mod(x, y);
    if (typeof x === "bigint") {
      // Not only does Math.floor not work for BigInt, it's not needed because
      // `/` does the right thing in the first place.

      // except for numbers of opposite sign
      if ((q < 0n) && (r > 0n)) {
        // There was a remainder.  JS rounded toward zero, but python
        // rounds down.
        q--;
      }
      return [q, r];
    }
    if (typeof q === "number") {
      return [Math.floor(q) as T, r];
    }
    throw new Error("Unreachable");
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
  static itSome<T>(
    it: IterableIterator<T>,
    f: itSomeCallback<T>,
    thisArg?: any
  ): boolean {
    let count = 0;
    for (const i of it) {
      if (f.call(thisArg, i, count++)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Is the given thing iterable?
   *
   * @param g - The thing to check.
   * @returns True if `g` looks like an iterable.
   */
  static isIterable(g: any): boolean {
    return g && (typeof g === "object") && (g[Symbol.iterator]);
  }

  /**
   * Cross product.  Translated from the python docs.
   *
   * @param iterables - Iterables to cross together.
   * @param repeat - Number of times to repeat the iterables.
   * @returns A generator yielding each of the combinations of the iterables.
   */
  static* product<T>(
    iterables: Iterable<T>[],
    repeat = 1
  ): Generator<T[], void, undefined> {
    const pools = this.ncycle(this.map(this.list, iterables), repeat);
    let result = [[]];
    for (const pool of pools) {
      const r2 = [];
      for (const x of result) {
        for (const y of pool) {
          r2.push(x.concat(y));
        }
        result = r2;
      }
    }
    yield* result;
  }

  /**
   * Yields all possible subsets of the input, including the input itself
   * and the empty set.
   *
   * @param iterable - Input.
   * @returns A generator yielding each subset.
   */
  static* powerset<T>(iterable: Iterable<T>): Generator<T[], void, undefined> {
    const pool: T[] = [...iterable];
    for (const len of this.range(pool.length + 1)) {
      yield* this.combinations(pool, len);
    }
  }

  /**
   * Yield the same value for ever.  And ever.
   * Value of VALUES! And Loop of LOOPS!
   *
   * @param val - The value to yield.
   * @returns A generator yielding val forever.
   */
  static* forEver(
    val: number | bigint = 0
  ): Generator<number | bigint, void, undefined> {
    while (true) {
      yield val;
    }
  }

  /**
   * Filter the iterable by a function.  If the function returns true,
   * the given value is yielded.  This should be a pretty big win over
   * `[...iterable].filter(fn)`.
   *
   * @param iterable - The iterable to filter.
   * @param fn - Function called for every item in iterable.
   * @param thisArg - Value to use as `this` in the filterCallback.
   * @returns A generator that yields iterable values that match.
   */
  static* filter<T>(
    iterable: Iterable<T>,
    fn: filterCallback<T>,
    thisArg?: any
  ): Generator<T, void, undefined> {
    let count = 0;
    for (const val of iterable) {
      if (fn.call(thisArg, val, count++, iterable)) {
        yield val;
      }
    }
  }

  // BELOW lifted from https://github.com/aureooms/js-itertools,
  // removed need for weird runtime
  // ----------

  /**
   * Like Python's range(), generate a series of numbers.
   *
   * @param start - The starting point
   * @param stop - The ending point, which isn't reached
   * @param step - How much to add each time, may be negative
   * @returns A generator that yields each number in the range
   */
  static* range(
    start: number,
    stop?: number,
    step = 1
  ): Generator<number, void, undefined> {
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

  /**
   * Pick some properties or array values out of `source`.
   *
   * @param source - Thing to select from
   * @param it - The indexes
   * @returns A generator that yields the selected items
   */
  static* pick<T>(
    source: Iterable<T>,
    it: Iterable<number>
  ): Generator<T, void, undefined> {
    // This is slower than it should be, but `it` might be out
    // of order, and so might `source`.
    const pool = Array.isArray(source) ? source : [...source];
    for (const i of it) {
      yield pool[i];
    }
  }

  /**
   *
   * @param source - The object to select from
   * @param it - The property names
   * @returns A generator that yields the selected items
   */
  static* pickObj(
    source: { [index: string]: any },
    it: Iterable<string>
  ): Generator<any, void, undefined> {
    for (const i of it) {
      yield source[i];
    }
  }

  /**
   * Combinations of a series, r at a time
   *
   * @param iterable - The series to iterate.
   * @param r - How many of the series to use in each combination?
   * @returns A generator that yields each combination
   */
  static* combinations<T>(
    iterable: Iterable<T>,
    r: number
  ): Generator<T[], void, undefined> {
    const pool = Array.isArray(iterable) ? iterable : [...iterable];
    const length = pool.length;

    if (r > length) {
      return;
    }

    const indices = [...this.range(r)];
    yield [...this.pick(pool, indices)];

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

      yield [...this.pick(pool, indices)];
    }
  }

  /**
   * Yields all elements of the iterable except the last <code>n</code> ones.
   * If <code>n</code> is negative, behaves like
   * <code>{@link take}(iterable, -n)</code>.
   *
   * @param iterable - Input
   * @param n - Number of elements to exclude at the end
   * @returns A generator that yields the front of the input
   */
  static* trunc<T>(
    iterable: Iterable<T>,
    n: number
  ): Generator<T, void, undefined> {
    if (n < 0) {
      yield* this.take(iterable, -n);
      return;
    }

    if (n === 0) {
      yield* iterable;
      return;
    }

    // Buffer up n entries, then serve old ones as we go
    const buffer = new Array(n);
    let cur = 0;
    let left = n;
    for (const value of iterable) {
      if (left > 0) {
        left--;
      } else {
        yield buffer[cur];
      }
      buffer[cur] = value;
      cur = (cur + 1) % n;
    }
  }

  /**
   * Yields the first <code>n</code> elements of the input iterable. If
   * <code>n</code> is negative, behaves like
   * <code>{@link trunc}(iterable, -n)</code>.
   *
   * @param iterable - The input iterable.
   * @param n - The number of elements to include in the output.
   * @returns A generator that yields the front of the input
   */
  static* take<T>(
    iterable: Iterable<T>,
    n: number
  ): Generator<T, void, undefined> {
    if (n === 0) {
      return;
    }

    if (n < 0) {
      yield* this.trunc(iterable, -n);
      return;
    }

    for (const val of iterable) {
      yield val;
      if (--n <= 0) {
        return;
      }
    }
  }

  /**
   * Yields all permutations of each possible choice of <code>r</code> elements
   * of the input iterable.
   *
   * @param iterable - The input iterable.
   * @param r - The size of the permutations to generate.
   * @returns A generator that yields each permutation.
   */
  static* permutations<T>(
    iterable: Iterable<T>,
    r: number
  ): Generator<T[], void, undefined> {
    const pool = [...iterable];
    const length = pool.length;

    if (r > length || r <= 0 || length === 0) {
      return;
    }

    const indices = [...this.range(length)];
    const cycles = [...this.range(length, length - r, -1)];

    yield [...this.pick(pool, this.take(indices, r))];

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
          [indices[i], indices[length - j]] = [indices[length - j], indices[i]];
          yield [...this.pick(pool, this.take(indices, r))];
          break;
        }
      }

      if (i === -1) {
        return;
      }
    }
  }

  /**
   * Cycle an iteable n times.
   *
   * @param iterable - The input iterable
   * @param n - The number of times to cycle through the input iterable
   * @returns A generator that yields each value from the iterable, cycled.
   */
  static* ncycle<T>(
    iterable: Iterable<T>,
    n: number
  ): Generator<T, void, undefined> {
    if (n <= 0) {
      // Nothing
    } else if (n === 1) {
      yield* iterable;
    } else {
      const buffer = [];
      for (const item of iterable) {
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

  /**
   * Map a function across all of the items in an iterable.
   *
   * @param callable - The mapping function
   * @param iterable - Source to map from
   * @param thisArg - Optional "this" inside of the callable
   * @returns A generator that yields the mapped values
   */
  static* map<T>(
    callable: mapCallback<T>,
    iterable: Iterable<T>,
    thisArg?: any
  ): Generator<any, void, undefined> {
    let c = 0;
    for (const item of iterable) {
      yield callable.call(thisArg, item, c++);
    }
  }

  /**
   * Convert an iterable into a list.  This is the same as `[...iterable]`
   * but slightly easier to call as a map function.
   *
   * @param iterable - The iterable to convert
   * @returns Converted to array
   */
  static list<T>(iterable: Iterable<T>): T[] {
    return Array.from(iterable);
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
  static reduce<T, A>(
    callback: reduceCallback<T, A>,
    iterable: Iterable<T>,
    initializer?: A
  ): A {
    if (initializer === undefined) {
      // No initializer?  Use the first item in the iterable
      const iter = iterable[Symbol.iterator]();
      const first = iter.next();

      if (first.done) {
        throw new TypeError("Empty iterable and no initializer");
      }
      initializer = first.value as unknown as A;
      iterable = {
        [Symbol.iterator]() {
          return iter;
        },
      };
    }

    let count = 0;
    for (const item of iterable) {
      initializer = callback(initializer, item, count++);
    }

    return initializer;
  }
}
