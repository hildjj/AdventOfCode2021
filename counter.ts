type countFilter = (n: number, s: string) => number | boolean;

/**
 * Count all the things!
 */
export default class Counter<T> {
  points: { [id: string]: number } = {};

  /**
   * Add a thing.
   *
   * @param vals - The list of values that describe the thing.
   */
  add(...vals: T[]) {
    const joined = vals.toString();
    this.points[joined] = (this.points[joined] || 0) + 1;
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
}
