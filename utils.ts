import * as fs from "fs";
import * as path from "path";
import peggy from "peggy";
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

interface FormattingError extends Error {
  format(sources: peggy.SourceText[]): string;
}

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
    if (process.argv.length < 2) {
      return;
    }
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
    const text = fs.readFileSync(filename, "utf8");

    // @type {function}
    let parserFunc = null;
    if (typeof parser === "function") {
      parserFunc = parser;
    } else {
      const parserFile = parser ?? this._adjacentFile(".peggy");
      const parserText = fs.readFileSync(parserFile, "utf8");
      parserFunc = peggy.generate(parserText, { trace }).parse;
    }

    try {
      return parserFunc(text, {
        grammarSource: filename,
        sourceMap: "inline",
        format: "es"
      });
    } catch (er) {
      if (typeof (er as FormattingError).format === "function") {
        console.error((er as FormattingError).format([
          { source: filename, text },
        ]));
      }
      throw er;
    }
  }

  /**
   * @returns The file with the given extension next to the calling file.
   */
  static _adjacentFile(ext: string, ...dir: string[]): string {
    // Idiomatic tcl
    let callerFile = this.callsites()[2].getFileName();
    if (!callerFile) {
      throw new Error("No caller file name");
    }
    if (callerFile.startsWith("file:")) {
      callerFile = url.fileURLToPath(callerFile);
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

    /* c8 ignore next */
    throw new Error("Unreachable");
  }
}
