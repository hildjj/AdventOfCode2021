type countFilter = (n: number, s: string) => number | boolean;

/**
 * Count all the things!
 */
export default class Counter<T> {
  points: { [id: string]: number } = {};

  /**
   * Iterate over the entries in points.
   */
  * [Symbol.iterator](): Generator<[string, number], void, undefined> {
    yield* Object.entries(this.points);
  }

  /**
   * Add a thing.
   *
   * @param vals - The list of values that describe the thing.
   * @returns - The current total for this thing.
   */
  add(...vals: T[]): number {
    const joined = vals.toString();
    const val = (this.points[joined] || 0) + 1;
    this.points[joined] = val;
    return val;
  }

  /**
   * Add something other than one.
   *
   * @param count - The amount to add.
   * @param vals - The list of values that describe the thing.
   * @returns number - The current total for this thing.
   */
  sum(count: number, ...vals: T[]): number {
    const joined = vals.toString();
    const val = (this.points[joined] || 0) + count;
    this.points[joined] = val;
    return val;
  }

  /**
   * Count the total number of things, possibly filtered.
   *
   * @param fn - A filter function
   * @returns The count of all of the things that match the filter.
   */
  total(fn: countFilter = () => true): number {
    return Object
      .entries(this.points)
      .reduce((t, [s, v]) => {
        const res = fn(v, s);
        if (typeof res === "boolean") {
          return t + (res ? 1 : 0);
        }
        return t + res;
      }, 0);
  }

  /**
   * The maximum entry.
   *
   * @returns the [key, value] of the maximum value, or null if empty.
   */
  max(): [string, number] | null {
    let mv = -Infinity;
    let mk: string | null = null;
    for (const [k, v] of this) {
      if (v > mv) {
        mv = v;
        mk = k;
      }
    }
    return (mk === null) ? mk : [mk, mv];
  }

  /**
   * How many unique things have been added?
   *
   * @returns The count.
   */
  size(): number {
    return Object.keys(this.points).length;
  }
}
