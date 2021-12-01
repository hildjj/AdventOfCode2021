import Utils from "../utils.js";
import sinon from "sinon";
import test from "ava";
import url from "url";

const INVALID_FILE = `_____DOES___NOT___EXIST:${process.pid}`;

test.afterEach.always("sinon cleanup", () => {
  sinon.restore();
});

test("main", t => {
  const oldArgv = process.argv;
  let main = sinon.fake.returns("foo");
  Utils.main(import.meta.url, main);
  t.is(main.callCount, 0);

  const clog = sinon.fake();
  sinon.replace(console, "log", clog);
  Utils.main(`file://${process.argv[1]}`, main);
  t.is(main.callCount, 1);
  t.deepEqual(main.args, [[
    undefined,
    false,
    {
      args: [],
      flags: [],
      params: [],
    }
  ]]);

  main = sinon.fake.returns("foo");
  process.argv = [process.argv0, "/foo", "input", "--trace", "other", "--myFlag"];
  Utils.main("file:/foo.js", main);
  t.deepEqual(main.args, [[
    "input",
    true,
    {
      args: ["input", "--trace", "other", "--myFlag"],
      flags: ["--trace", "--myFlag"],
      params: ["input", "other"],
    }
  ]]);

  t.deepEqual(clog.args, [["'foo'"], ["'foo'"]]);
  process.argv = oldArgv;
});

test("readLines", t => {
  const r = Utils.readLines();
  t.deepEqual(r, ["1", "2"]);
});

test("parseFile", t => {
  const r = Utils.parseFile();
  t.deepEqual(r, ["1", "2"]);

  const parse = () => ["3", "4"];
  const fn = url.fileURLToPath(new URL("inputs/utils.ava.txt", import.meta.url));
  const u = Utils.parseFile(fn, parse);
  t.deepEqual(u, ["3", "4"]);

  t.throws(() => Utils.parseFile(undefined, INVALID_FILE));
});

test("mod", t => {
  t.is(Utils.mod<number>(4, 4), 0);
  t.is(Utils.mod<number>(-5, 4), 3);
  t.is(Utils.mod<bigint>(4n, 4n), 0n);
  t.is(Utils.mod<bigint>(-5n, 4n), 3n);
  t.is(Utils.mod<bigint>(-5n, -4n), -1n);
  t.throws(() => Utils.mod(4, 0), { message: "Division by zero" });
  t.throws(() => Utils.mod(4n, 0n), { message: "Division by zero" });
});

test("divmod", t => {
  t.deepEqual(Utils.divmod<number>(4, 4), [1, 0]);
  t.deepEqual(Utils.divmod<number>(-5, 4), [-2, 3]);

  t.deepEqual(Utils.divmod<bigint>(4n, 4n), [1n, 0n]);
  t.deepEqual(Utils.divmod<bigint>(-5n, 4n), [-2n, 3n]);
  t.deepEqual(Utils.divmod<bigint>(-5n, -4n), [1n, -1n]);

  t.throws(() => Utils.divmod(4, 0), { message: "Division by zero" });
  t.throws(() => Utils.divmod(4n, 0n), { message: "Division by zero" });
});

test("itSome", t => {
  t.true(Utils.itSome(Utils.range(3), i => (i % 2) !== 0));
  t.false(Utils.itSome([1, 3, 5], i => (i % 2) === 0));
  const u = {};

  // Has to be a "function", otherwise "this" gets mangled.
  function smallThis(this: object, _: number, i: number): boolean {
    return (i < 3) && (this === u);
  }

  t.true(Utils.itSome([1, 3, 5], smallThis, u));
});

test("range", t => {
  const seen = [];
  for (const x of Utils.range(4)) {
    seen.push(x);
  }
  t.deepEqual(seen, [0, 1, 2, 3]);
  t.deepEqual([...Utils.range(4, 0, -1)], [4, 3, 2, 1]);
});

test("pick", t => {
  t.deepEqual([...Utils.pick(Utils.range(4), [1, 3])], [1, 3]);
  t.deepEqual([...Utils.pickObj({ a: 1, b: 2 }, ["b"])], [2]);
});

test("combinations", t => {
  t.deepEqual([...Utils.combinations(Utils.range(3), 5)], []);
  t.deepEqual([...Utils.combinations([0, 1, 2], 2)], [[0, 1], [0, 2], [1, 2]]);
});

test("trunc", t => {
  t.deepEqual([...Utils.trunc(Utils.range(3), 0)], [0, 1, 2]);
  t.deepEqual([...Utils.trunc(Utils.range(10), 3)], [0, 1, 2, 3, 4, 5, 6]);
  t.deepEqual([...Utils.trunc(Utils.range(10), -3)], [0, 1, 2]);
});

test("take", t => {
  t.deepEqual([...Utils.take(Utils.range(3), 0)], []);
  t.deepEqual([...Utils.take(Utils.range(3), 3)], [0, 1, 2]);
  t.deepEqual([...Utils.take(Utils.range(3), 4)], [0, 1, 2]);
  t.deepEqual([...Utils.take(Utils.range(10), 3)], [0, 1, 2]);
  t.deepEqual([...Utils.take(Utils.range(10), -3)], [0, 1, 2, 3, 4, 5, 6]);
});

test("permutations", t => {
  t.deepEqual([...Utils.permutations("ABCD", 2)].map(a => a.join("")), [
    "AB", "AC", "AD", "BA", "BC", "BD", "CA", "CB", "CD", "DA", "DB", "DC"
  ]);
  t.deepEqual([...Utils.permutations([], 1)], []);
  t.deepEqual([...Utils.permutations([1, 2, 3], 0)], []);
  t.deepEqual([...Utils.permutations([1, 2, 3], 5)], []);
  t.deepEqual([...Utils.permutations([1, 2, 3], -5)], []);
});

test("powerset", t => {
  t.deepEqual([...Utils.powerset("ABC")].map(a => a.join("")), [
    "", "A", "B", "C", "AB", "AC", "BC", "ABC"
  ]);
});

test("forEver", t => {
  t.deepEqual([...Utils.take<string>(Utils.forEver("and ever"), 4)], [
    "and ever", "and ever", "and ever", "and ever"
  ]);
});

test("filter", t => {
  t.deepEqual(
    [...Utils.filter(Utils.take(Utils.range(0, 10000), 10), t => t % 2 !== 0)],
    [1, 3, 5, 7, 9]
  );
});

test("product", t => {
  t.deepEqual(
    [...Utils.product(["AB"], 2)].map(a => a.join("")),
    ["AA", "AB", "BA", "BB"]
  );
  t.deepEqual(
    [...Utils.product(["AB", "CD"])].map(a => a.join("")),
    ["AC", "AD", "BC", "BD"]
  );
});

test("ncycle", t => {
  t.deepEqual([...Utils.ncycle("AB", 0)], []);
  t.deepEqual([...Utils.ncycle("AB", 1)], ["A", "B"]);
  t.deepEqual([...Utils.ncycle("AB", 2)], ["A", "B", "A", "B"]);
  t.deepEqual([...Utils.ncycle([], 2)], []);
});

test("reduce", t => {
  t.is(Utils.reduce<number, number>((t, x) => t + x, Utils.range(10)), 45);
  t.is(Utils.reduce<number, number>((t, x) => t + x, Utils.range(10), 1), 46);
  t.throws(() => Utils.reduce(() => 0, []), { message: "Empty iterable and no initializer" });
});
