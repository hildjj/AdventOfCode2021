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
