import * as utils from "../index.mjs";

describe("Text-related functions", () => {
	describe("escapeHTML()", () => {
		const {escapeHTML} = utils;
		it("escapes angle brackets", () => void expect(escapeHTML("< < > >")).to.equal("&#60; &#60; &#62; &#62;"));
		it("escapes ampersands",     () => void expect(escapeHTML("A & B & Z")).to.equal("A &#38; B &#38; Z"));
		it("escapes double-quotes",  () => void expect(escapeHTML('A \\"B" Z')).to.equal("A \\&#34;B&#34; Z"));
		it("escapes single-quotes",  () => void expect(escapeHTML("A \\'B' Z")).to.equal("A \\&#39;B&#39; Z"));
	});
	
	describe("escapeRegExp()", () => {
		const {escapeRegExp} = utils;
		it("escapes backslashes",       () => void expect(escapeRegExp("\\")).to.equal("\\\\"));
		it("escapes metacharacters",    () => void expect(escapeRegExp("$")).to.equal("\\$"));
		it("escapes character classes", () => void expect(escapeRegExp("[ABC]")).to.equal("\\[ABC\\]"));
		it("escapes capturing groups",  () => void expect(escapeRegExp("(A)")).to.equal("\\(A\\)"));
		it("escapes source accurately", () => {
			const pattern = /^ember(?:\.|(?:-[^.]+)?-(?:\d+\.)+(?:debug\.)?)js$/i;
			const source = escapeRegExp(pattern.source);
			expect(new RegExp(source).test(pattern.source)).to.be.true;
		});
	});
	
	describe("formatTime()", () => {
		const {formatTime} = utils;
		it("formats milliseconds",    () => expect(formatTime(945))      .to.equal("00:00:00.945"));
		it("formats seconds",         () => expect(formatTime(1753))     .to.equal("00:00:01.753"));
		it("formats minutes",         () => expect(formatTime(90999))    .to.equal("00:01:30.999"));
		it("formats hours",           () => expect(formatTime(12625000)) .to.equal("03:30:25.000"));
		it("formats hours over 99",   () => expect(formatTime(432000000)).to.equal("120:00:00.000"));
		it("ignores negative values", () => expect(formatTime(-500))     .to.equal("00:00:00.000"));
		it("ignores invalid input",   () => {
			const zero = "00:00:00.000";
			expect(formatTime(NaN)) .to.equal(zero);
			expect(formatTime({}))  .to.equal(zero);
			expect(formatTime())    .to.equal(zero);
		});
		it("rounds off fractional values", () => {
			expect(formatTime(504.45)).to.equal("00:00:00.504");
			expect(formatTime(504.65)).to.equal("00:00:00.505");
		});
		it("coerces non-numeric values", () => {
			expect(formatTime({valueOf: () => 450}))    .to.equal("00:00:00.450");
			expect(formatTime({valueOf: () => 450.75})) .to.equal("00:00:00.451");
		});
	});
	
	describe("parseTime()", () => {
		const {parseTime} = utils;
		const expectError = input => {
			const escaped = String(input).replace(/\./g, "\\.");
			const message = new RegExp(`^Invalid timecode: "${escaped}"$`);
			expect(() => parseTime(input)).to.throw(SyntaxError, message);
		};
		
		describe("Milliseconds", () => {
			it("allows the component to be omitted", () => {
				expect(parseTime("00:00:00")).to.equal(0);
				expect(parseTime("00;00;00")).to.equal(0);
			});
			
			describe("Dot-separated", () => {
				it("parses 1-digit values",    () => expect(parseTime("00:00:00.1"))    .to.equal(100));
				it("parses 2-digit values",    () => expect(parseTime("00:00:00.25"))   .to.equal(250));
				it("parses 3-digit values",    () => expect(parseTime("00:00:00.200"))  .to.equal(200));
				it("parses leading zeroes",    () => expect(parseTime("00:00:00.03"))   .to.equal(30));
				it("parses trailing zeroes",   () => expect(parseTime("00:00:00.40"))   .to.equal(400));
				it("discards excess digits",   () => expect(parseTime("00:00:00.5009")) .to.equal(500));
				it("expects at least 1 digit", () => expectError("00:00:00."));
			});
			
			describe("Comma-separated", () => {
				it("parses 1-digit values",    () => expect(parseTime("00:00:00,1"))    .to.equal(100));
				it("parses 2-digit values",    () => expect(parseTime("00:00:00,25"))   .to.equal(250));
				it("parses 3-digit values",    () => expect(parseTime("00:00:00,200"))  .to.equal(200));
				it("parses leading zeroes",    () => expect(parseTime("00:00:00,03"))   .to.equal(30));
				it("parses trailing zeroes",   () => expect(parseTime("00:00:00,40"))   .to.equal(400));
				it("discards excess digits",   () => expect(parseTime("00:00:00,5009")) .to.equal(500));
				it("expects at least 1 digit", () => expectError("00:00:00,"));
			});
		});
		
		describe("Seconds", () => {
			describe("Colon-delimited", () => {
				it("parses 1-digit values",     () => expect(parseTime("00:00:1.000"))   .to.equal(1000));
				it("parses 2-digit values",     () => expect(parseTime("00:00:25.000"))  .to.equal(25000));
				it("parses values over 60",     () => expect(parseTime("00:00:90.000"))  .to.equal(90000));
				it("parses 3-digit values",     () => expect(parseTime("00:00:180.000")) .to.equal(180000));
				it("parses 4-digit values",     () => expect(parseTime("00:00:1024.000")).to.equal(1024000));
				it("parses leading zeroes",     () => expect(parseTime("00:00:0001.000")).to.equal(1000));
				it("parses trailing zeroes",    () => expect(parseTime("00:00:1000.000")).to.equal(1000000));
				it("forbids missing values",    () => expectError("00:00:.000"));
				it("forbids fractional values", () => expectError("00:00:1.5,000"));
			});
			
			describe("Semicolon-delimited", () => {
				it("parses 1-digit values",     () => expect(parseTime("00;00;1.000"))   .to.equal(1000));
				it("parses 2-digit values",     () => expect(parseTime("00;00;25.000"))  .to.equal(25000));
				it("parses values over 60",     () => expect(parseTime("00;00;90.000"))  .to.equal(90000));
				it("parses 3-digit values",     () => expect(parseTime("00;00;180.000")) .to.equal(180000));
				it("parses 4-digit values",     () => expect(parseTime("00;00;1024.000")).to.equal(1024000));
				it("parses leading zeroes",     () => expect(parseTime("00;00;0001.000")).to.equal(1000));
				it("parses trailing zeroes",    () => expect(parseTime("00;00;1000.000")).to.equal(1000000));
				it("allows mixed delimiters",   () => expect(parseTime("00:00;09.000"))  .to.equal(9000));
				it("forbids missing values",    () => expectError("00;00;.000"));
				it("forbids fractional values", () => expectError("00;00;1.5,000"));
			});
		});
		
		describe("Minutes", () => {
			describe("Colon-delimited", () => {
				it("parses 1-digit values",     () => expect(parseTime("00:1:00.000"))   .to.equal(60000));
				it("parses 2-digit values",     () => expect(parseTime("00:25:00.000"))  .to.equal(1500000));
				it("parses values over 60",     () => expect(parseTime("00:90:00.000"))  .to.equal(5400000));
				it("parses 3-digit values",     () => expect(parseTime("00:180:00.000")) .to.equal(10800000));
				it("parses 4-digit values",     () => expect(parseTime("00:1024:00.000")).to.equal(61440000));
				it("parses leading zeroes",     () => expect(parseTime("00:0001:00.000")).to.equal(60000));
				it("parses trailing zeroes",    () => expect(parseTime("00:1000:00.000")).to.equal(60000000));
				it("forbids missing values",    () => expectError("00::00.000"));
				it("forbids fractional values", () => expectError("00:1.5:00,000"));
			});
			
			describe("Semicolon-delimited", () => {
				it("parses 1-digit values",     () => expect(parseTime("00;1;00.000"))   .to.equal(60000));
				it("parses 2-digit values",     () => expect(parseTime("00;25;00.000"))  .to.equal(1500000));
				it("parses values over 60",     () => expect(parseTime("00;90;00.000"))  .to.equal(5400000));
				it("parses 3-digit values",     () => expect(parseTime("00;180;00.000")) .to.equal(10800000));
				it("parses 4-digit values",     () => expect(parseTime("00;1024;00.000")).to.equal(61440000));
				it("parses leading zeroes",     () => expect(parseTime("00;0001;00.000")).to.equal(60000));
				it("parses trailing zeroes",    () => expect(parseTime("00;1000;00.000")).to.equal(60000000));
				it("allows mixed delimiters",   () => expect(parseTime("00:09;00.000"))  .to.equal(540000));
				it("forbids missing values",    () => expectError("00;;00.000"));
				it("forbids fractional values", () => expectError("00;1.5;00,000"));
			});
		});
		
		describe("Hours", () => {
			describe("Colon-delimited", () => {
				it("parses 1-digit values",     () => expect(parseTime("1:00:00.000"))   .to.equal(3600000));
				it("parses 2-digit values",     () => expect(parseTime("25:00:00.000"))  .to.equal(90000000));
				it("parses values over 24",     () => expect(parseTime("48:00:00.000"))  .to.equal(172800000));
				it("parses 3-digit values",     () => expect(parseTime("180:00:00.000")) .to.equal(648000000));
				it("parses 4-digit values",     () => expect(parseTime("1024:00:00.000")).to.equal(3686400000));
				it("parses leading zeroes",     () => expect(parseTime("0001:00:00.000")).to.equal(3600000));
				it("parses trailing zeroes",    () => expect(parseTime("1000:00:00.000")).to.equal(3600000000));
				it("forbids fractional values", () => expectError("1.5:00:00,000"));
				it("allows missing values",     () => {
					expect(parseTime("15:00.000")).to.equal(900000);
					expect(parseTime("15:25"))    .to.equal(925000);
				});
				it("expects at least 1 digit", () => {
					expectError(":15:00.000");
					expectError(":15:25");
				});
			});
			
			describe("Semicolon-delimited", () => {
				it("parses 1-digit values",     () => expect(parseTime("1;00;00.000"))   .to.equal(3600000));
				it("parses 2-digit values",     () => expect(parseTime("25;00;00.000"))  .to.equal(90000000));
				it("parses values over 24",     () => expect(parseTime("48;00;00.000"))  .to.equal(172800000));
				it("parses 3-digit values",     () => expect(parseTime("180;00;00.000")) .to.equal(648000000));
				it("parses 4-digit values",     () => expect(parseTime("1024;00;00.000")).to.equal(3686400000));
				it("parses leading zeroes",     () => expect(parseTime("0001;00;00.000")).to.equal(3600000));
				it("parses trailing zeroes",    () => expect(parseTime("1000;00;00.000")).to.equal(3600000000));
				it("allows mixed delimiters",   () => expect(parseTime("09:00;00.000"))  .to.equal(32400000));
				it("forbids fractional values", () => expectError("1.5;00;00,000"));
				it("allows missing values",     () => {
					expect(parseTime("15;00.000")).to.equal(900000);
					expect(parseTime("15;25"))    .to.equal(925000);
				});
				it("expects at least 1 digit", () => {
					expectError(";15;00.000");
					expectError(";15;25");
				});
			});
		});
		
		describe("Invalid input", () => {
			it("rejects invalid formats",     () => expectError("Invalid"));
			it("rejects empty strings",       () => expectError(""));
			it("rejects non-string values",   () => expectError(false));
			it("trims leading whitespace",    () => expect(parseTime(" \t\n00:00:01.000")).to.equal(1000));
			it("trims trailing whitespace",   () => expect(parseTime("00:00:02.000 \t\n")).to.equal(2000));
			it("rejects embedded whitespace", () => expectError("00:00: 04.000"));
			it("rejects too many components", () => expectError("00:00:00:01.456"));
			it("stringifies before parsing",  () => {
				expect(parseTime({toString: () => "0:1.567"}))         .to.equal(1567);
				expect(parseTime({toString: () => "\n\t0:1.567\t\n"})) .to.equal(1567);
			});
		});
	});
	
	describe("smartSplit()", () => {
		const {smartSplit} = utils;
		describe("Delimiters", () => {
			const list = ["foo", "bar", "baz"];
			it("uses space, tab and newline as defaults", () => {
				expect(smartSplit("foo bar baz")).to.eql(list);
				expect(smartSplit("foo\tbar\tbaz")).to.eql(list);
				expect(smartSplit("foo\nbar\nbaz")).to.eql(list);
			});
			it("allows them to be changed", () => {
				expect(smartSplit("foo|bar|baz", {delimiters: "|"})).to.eql(list);
				expect(smartSplit("foo.bar|baz", {delimiters: "|."})).to.eql(list);
				expect(smartSplit("foo bar|baz", {delimiters: "|"})).to.eql(["foo bar", "baz"]);
			});
			it("treats contiguous delimiters as one", () => {
				expect(smartSplit("foo  bar   baz")).to.eql(list);
				expect(smartSplit("foo\t\tbar\t\t\tbaz")).to.eql(list);
				expect(smartSplit("foo\n\nbar\n\n\nbaz")).to.eql(list);
			});
			it("allows different delimiters to be used interchangeably", () => {
				expect(smartSplit("foo \tbar \tbaz")).to.eql(list);
				expect(smartSplit("foo\t\nbar\t\nbaz")).to.eql(list);
				expect(smartSplit("foo \t\n \n\t\n bar \n\t\tbaz")).to.eql(list);
				expect(smartSplit("foo | . bar . | . baz", {delimiters: ".| "})).to.eql(list);
			});
			it("skips leading and trailing delimiters", () => {
				expect(smartSplit(" foo")).to.eql(["foo"]);
				expect(smartSplit("  foo")).to.eql(["foo"]);
				expect(smartSplit("foo ")).to.eql(["foo"]);
				expect(smartSplit("foo  ")).to.eql(["foo"]);
				expect(smartSplit(" foo ")).to.eql(["foo"]);
				expect(smartSplit("|foo", {delimiters: "|"})).to.eql(["foo"]);
				expect(smartSplit("| foo", {delimiters: "|"})).to.eql([" foo"]);
				expect(smartSplit("||foo||bar||", {delimiters: "|"})).to.eql(["foo", "bar"]);
			});
		});
		
		describe("Quotes", () => {
			it("defaults to single-quotes, double-quotes and backticks", () => {
				expect(smartSplit("'foo'")).to.eql(["foo"]);
				expect(smartSplit('"foo"')).to.eql(["foo"]);
				expect(smartSplit("`foo`")).to.eql(["foo"]);
				expect(smartSplit('"foo bar" baz')).to.eql(["foo bar", "baz"]);
				expect(smartSplit("'foo bar' baz")).to.eql(["foo bar", "baz"]);
				expect(smartSplit("`foo bar` baz")).to.eql(["foo bar", "baz"]);
			});
			
			it("avoids splitting on delimiters between quote pairs", () => {
				expect(smartSplit("foo 'bar baz' qux")).to.eql(["foo", "bar baz", "qux"]);
				expect(smartSplit("'foo bar ' baz qux")).to.eql(["foo bar ", "baz", "qux"]);
				expect(smartSplit("foo bar ' baz qux'")).to.eql(["foo", "bar", " baz qux"]);
				expect(smartSplit("foo 'bar baz qux'")).to.eql(["foo", "bar baz qux"]);
			});
			
			it("includes quotes if `keepQuotes` is set", () =>
				expect(smartSplit("'foo'", {keepQuotes: true})).to.eql(["'foo'"]));
			
			it("recognises them without an adjacent delimiter", () => {
				const list = ["foo", "bar baz", "qux"];
				expect(smartSplit("foo b'ar ba'z qux")).to.eql(list);
				expect(smartSplit("foo b'ar baz' qux")).to.eql(list);
				expect(smartSplit("foo 'bar ba'z qux")).to.eql(list);
			});
			
			it("allows the quote characters to be changed", () => {
				const opts = {quoteChars: "/"};
				expect(smartSplit("foo /bar baz/ qux", opts)).to.eql(["foo", "bar baz", "qux"]);
				expect(smartSplit("/foo bar  baz / qux", opts)).to.eql(["foo bar  baz ", "qux"]);
				expect(smartSplit("/foo bar/ 'baz qux'", opts)).to.eql(["foo bar", "'baz", "qux'"]);
				expect(smartSplit("~foo bar~ /baz qux/", {quoteChars: "~/"})).to.eql(["foo bar", "baz qux"]);
			});

			it("doesn't get confused by nested quotes", () => {
				let test = "a 'b `c' `d e'` f";
				expect(smartSplit(test)).to.eql(["a", "b `c", "d e'", "f"]);
				expect(smartSplit(test, {keepQuotes: true})).to.eql(["a", "'b `c'", "`d e'`", "f"]);
				test = "a /b `c/ `d e/` f";
				expect(smartSplit(test, {quoteChars: "/`"})).to.eql(["a", "b `c", "d e/", "f"]);
				expect(smartSplit(test, {quoteChars: "/`", keepQuotes: true})).to.eql(["a", "/b `c/", "`d e/`", "f"]);
			});
			
			it("treats empty quote pairs as empty elements", () => {
				expect(smartSplit("foo '' bar")).to.eql(["foo", "", "bar"]);
				expect(smartSplit("foo '''' bar")).to.eql(["foo", "", "bar"]);
				expect(smartSplit("foo ''`` bar")).to.eql(["foo", "", "bar"]);
				expect(smartSplit("foo '' `` bar")).to.eql(["foo", "", "", "bar"]);
				expect(smartSplit("foo ''' bar")).to.eql(["foo", " bar"]);
				expect(smartSplit("foo '' ``")).to.eql(["foo", "", ""]);
				expect(smartSplit("''")).to.eql([""]);
				expect(smartSplit(" '' ")).to.eql([""]);
				expect(smartSplit("''' ")).to.eql([" "]);
				expect(smartSplit("'' ``")).to.eql(["", ""]);
				expect(smartSplit("'' `` ")).to.eql(["", ""]);
				expect(smartSplit("'' `` foo")).to.eql(["", "", "foo"]);
				expect(smartSplit("''", {keepQuotes: true})).to.eql(["''"]);
				expect(smartSplit("foo '' bar", {keepQuotes: true})).to.eql(["foo", "''", "bar"]);
				expect(smartSplit("foo '''' bar", {keepQuotes: true})).to.eql(["foo", "''''", "bar"]);
				expect(smartSplit("foo ''`` bar", {keepQuotes: true})).to.eql(["foo", "''``", "bar"]);
				expect(smartSplit("foo '' `` bar", {keepQuotes: true})).to.eql(["foo", "''", "``", "bar"]);
			});
		});
	
		describe("Escapes", () => {
			it("ignores delimiters preceded by an escape", () =>
				expect(smartSplit("foo\\ bar")).to.eql(["foo bar"]));
			
			it("ignores quotes preceded by an escape", () =>
				expect(smartSplit("foo \\'bar baz\\' qux")).to.eql(["foo", "'bar", "baz'", "qux"]));
			
			it("ignores escape characters preceded by another escape", () =>
				expect(smartSplit("foo\\\\ bar")).to.eql(["foo\\", "bar"]));
			
			it("doesn't require escapes to be used on special characters", () =>
				expect(smartSplit("foo\\bar")).to.eql(["foobar"]));
			
			it("includes them if `keepEscapes` is set", () =>
				expect(smartSplit("foo\\ bar", {keepEscapes: true})).to.eql(["foo\\ bar"]));
		
			it("allows different escape characters to be used", () => {
				expect(smartSplit("foo% bar", {escapeChars: "%"})).to.eql(["foo bar"]);
				expect(smartSplit("foo% bar", {escapeChars: "%", keepEscapes: true})).to.eql(["foo% bar"]);
			});
			
			it("allows different escape characters to be mixed", () => {
				expect(smartSplit("foo%\\ bar", {escapeChars: "%\\"})).to.eql(["foo\\", "bar"]);
				expect(smartSplit("foo%\\ bar", {escapeChars: "%\\", keepEscapes: true})).to.eql(["foo%\\", "bar"]);
			});
			
			it("recognises them inside quoted regions", () => {
				expect(smartSplit("foo 'bar\\'s baz' qux")).to.eql(["foo", "bar's baz", "qux"]);
				expect(smartSplit("foo 'bar\\\\'s baz qux'")).to.eql(["foo", "bar\\s", "baz", "qux"]);
			});
			
			it("does nothing if input terminates early", () =>
				expect(smartSplit("foo \\")).to.eql(["foo"]));
		});
	});

	describe("splitOptions()", function(){
		this.slow(500);
		const {splitOptions} = utils;
		const defaultJunk = [[], ["x"], ["xy"], ["x y"], ["x", "y"], ["xyz", "uvw"], ["x", "y", "z"]];
		const defaultLong = ["foo", "foo|bar", "foo|bar|baz"];
		const doTest = (argv, opts, expected) => {
			const originalArgv = JSON.parse(JSON.stringify(argv));
			expect(splitOptions(argv, ...opts)).to.eql(expected);
			expect(argv, "Argv should not have been modified").to.eql(originalArgv);
		};
		const runTests = (...$) => $.map(({opts, tests, junkArgs = defaultJunk}) => {
			for(const z of opts[2])
			for(const y of opts[1])
			for(const x of opts[0])
			for(const {argv, expected} of tests)
			for(const junk of junkArgs){
				doTest(argv, [x, y, z], expected);
				doTest(argv.concat(junk),       [x, y, z], expected.concat(junk));
				doTest(junk.concat(argv),       [x, y, z], junk.concat(expected));
				doTest(junk.concat(argv, junk), [x, y, z], junk.concat(expected, junk));
			}
		});
		
		it("unbundles niladic options", () => runTests({
			opts: [["abc"], ["", "x", "xyz"], defaultLong],
			tests: [
				{argv: ["-abc"],      expected: ["-a", "-b", "-c"]},
				{argv: ["-ab", "-c"], expected: ["-a", "-b", "-c"]},
				{argv: ["-a", "-bc"], expected: ["-a", "-b", "-c"]},
				{argv: ["-a", "bc"],  expected: ["-a", "bc"]},
				{argv: ["a", "-bc"],  expected: ["a", "-b", "-c"]},
				{argv: ["-", "abc"],  expected: ["-", "abc"]},
			],
		}));
		
		it("unbundles monadic options", () => runTests({
			opts: [["", "x", "xyz"], ["abc"], defaultLong],
			tests: [
				{argv: ["-a1"],           expected: ["-a", "1"]},
				{argv: ["-a", "1"],       expected: ["-a", "1"]},
				{argv: ["-a1", "-b2"],    expected: ["-a", "1", "-b", "2"]},
				{argv: ["a", "1", "-b2"], expected: ["a",  "1", "-b", "2"]},
				{argv: ["-a", "-b2"],     expected: ["-a", "-b2"]},
				{argv: ["-ab2"],          expected: ["-a", "b2"]},
			],
		}, {
			opts: [["a"], ["bc"], ["foo", "foo|bar", "foo|bar|baz"]],
			tests: [{argv: ["-ab", "-c2"], expected: ["-a", "-b", "-c2"]}],
		}));
		
		it("unbundles mixed-arity options", () => runTests({
			opts: [["ab"], ["c"], defaultLong],
			tests: [
				{argv: ["-abc1"],          expected: ["-a", "-b", "-c", "1"]},
				{argv: ["-a", "-bc", "1"], expected: ["-a", "-b", "-c", "1"]},
				{argv: ["-bc",  "-ab"],    expected: ["-b", "-c", "-ab"]},
				{argv: ["-bc1", "-ab"],    expected: ["-b", "-c", "1", "-a", "-b"]},
				{argv: ["-bca", "-ab"],    expected: ["-b", "-c", "a", "-a", "-b"]},
			],
		}, {
			opts: [["b"], ["ac"], defaultLong],
			tests: [{argv: ["-a1b", "-c"], expected: ["-a", "1b", "-c"]}],
		}));
		
		it("splits --long-option=values", () => runTests({
			opts: [["", "a", "abc"], ["", "x", "xyz"], ["foo|bar"]],
			tests: [
				{argv: ["--foo=bar"],             expected: ["--foo", "bar"]},
				{argv: ["--foo", "1", "--bar=2"], expected: ["--foo", "1", "--bar", "2"]},
				{argv: ["--foo",  "bar"],         expected: ["--foo", "bar"]},
				{argv: ["--foo=", "bar"],         expected: ["--foo", "", "bar"]},
			],
		}));
		
		it("does not include missing parameters", () => runTests({
			opts: [[""], ["abc"], defaultLong],
			tests: [
				{argv: ["-a"],         expected: ["-a"]},
				{argv: ["-a1"],        expected: ["-a", "1"]},
				{argv: ["-a1", "-b"],  expected: ["-a", "1", "-b"]},
			],
		}, {
			opts: [["a"], ["bc"], defaultLong],
			tests: [
				{argv: ["-ab"],        expected: ["-a", "-b"]},
				{argv: ["-ab", "-c1"], expected: ["-a", "-b", "-c1"]},
			],
		}));
		
		it("ignores bundles beginning with an unknown option", () => runTests({
			opts: [["abc"], ["", "u", "uvw"], defaultLong],
			tests: [
				{argv: ["-xabc"],      expected: ["-xabc"]},
				{argv: ["-x", "-abc"], expected: ["-x", "-a", "-b", "-c"]},
				{argv: ["-xa", "-bc"], expected: ["-xa", "-b", "-c"]},
			],
		}));
		
		it("ignores unknown --long-option=values", () => runTests({
			opts: [["", "a", "abc"], ["", "x", "xyz"], ["bar"]],
			tests: [
				{argv: ["--foo=bar"],        expected: ["--foo=bar"]},
				{argv: ["--foo", "--bar=2"], expected: ["--foo", "--bar", "2"]},
			],
		}, {
			opts: [["", "a", "abc"], ["", "x", "xyz"], ["foo|bar", "bar|foo"]],
			tests: [{argv: ["--foo", "--bar=2"], expected: ["--foo", "--bar=2"]}],
		}));
		
		it("expands unknown options that follow a known one", () => runTests({
			opts: [["a"], ["", "x", "xyz"], defaultLong],
			tests: [
				{argv: ["-ab"],  expected: ["-a", "-b"]},
				{argv: ["-abc"], expected: ["-a", "-b", "-c"]},
			],
		}, {
			opts: [["a"], ["b"], defaultLong],
			tests: [{argv: ["-acb1"], expected: ["-a", "-c", "-b", "1"]}],
		}));
		
		it("returns an empty array for empty input", () => {
			expect(splitOptions()).to.eql([]);
			expect(splitOptions(null)).to.eql([]);
			expect(splitOptions(false)).to.eql([]);
		});
		
		it("boxes string arguments into arrays", () => {
			expect(splitOptions("-abc", "abc")).to.eql(["-a", "-b", "-c"]);
			expect(splitOptions("-abc", "a", "bc")).to.eql(["-a", "-b", "c"]);
		});
	});

	describe("timeSince()", () => {
		const {timeSince} = utils;
		const SEC  = 1000;
		const MIN  = SEC  * 60;
		const HOUR = MIN  * 60;
		const DAY  = HOUR * 24;
		const WEEK = DAY  * 7;
		const MON  = WEEK * 4.345238;
		const YEAR = MON  * 12;
		const DEC  = YEAR * 10;
		const CENT = DEC  * 10;
		const MILL = CENT * 10;
		
		describe("Seconds", () => {
			describe("Past intervals", () => {
				it("formats 1 second",   () => expect(timeSince(SEC * 1)).to.equal("Just now"));
				it("formats 2 seconds",  () => expect(timeSince(SEC * 2)).to.equal("2 seconds ago"));
				it("formats 10 seconds", () => expect(timeSince(SEC * 10)).to.equal("10 seconds ago"));
				it("formats 35 seconds", () => expect(timeSince(SEC * 35)).to.equal("35 seconds ago"));
				it("formats 49 seconds", () => expect(timeSince(SEC * 49)).to.equal("49 seconds ago"));
				it("formats 59 seconds", () => expect(timeSince(SEC * 59)).to.equal("59 seconds ago"));
				it("includes fractions", () => {
					expect(timeSince(SEC * 1.1))  .to.equal("Just now");
					expect(timeSince(SEC * 1.9))  .to.equal("Just now");
					expect(timeSince(SEC * 2.5))  .to.equal("2.5 seconds ago");
					expect(timeSince(SEC * 2.05)) .to.equal("2.05 seconds ago");
					expect(timeSince(SEC * 59.5)) .to.equal("59.5 seconds ago");
				});
			});
			
			describe("Future intervals", () => {
				it("formats 1 second",   () => expect(timeSince(SEC * -1)).to.equal("Just now"));
				it("formats 2 seconds",  () => expect(timeSince(SEC * -2)).to.equal("2 seconds from now"));
				it("formats 10 seconds", () => expect(timeSince(SEC * -10)).to.equal("10 seconds from now"));
				it("formats 35 seconds", () => expect(timeSince(SEC * -35)).to.equal("35 seconds from now"));
				it("formats 49 seconds", () => expect(timeSince(SEC * -49)).to.equal("49 seconds from now"));
				it("formats 59 seconds", () => expect(timeSince(SEC * -59)).to.equal("59 seconds from now"));
				it("includes fractions", () => {
					expect(timeSince(SEC * -1.1))  .to.equal("Just now");
					expect(timeSince(SEC * -1.9))  .to.equal("Just now");
					expect(timeSince(SEC * -2.5))  .to.equal("2.5 seconds from now");
					expect(timeSince(SEC * -2.05)) .to.equal("2.05 seconds from now");
					expect(timeSince(SEC * -59.5)) .to.equal("59.5 seconds from now");
				});
			});
		});
		
		describe("Minutes", () => {
			describe("Past intervals", () => {
				it("formats 1 minute",   () => expect(timeSince(MIN * 1)).to.equal("A minute ago"));
				it("formats 2 minutes",  () => expect(timeSince(MIN * 2)).to.equal("2 minutes ago"));
				it("formats 10 minutes", () => expect(timeSince(MIN * 10)).to.equal("10 minutes ago"));
				it("formats 35 minutes", () => expect(timeSince(MIN * 35)).to.equal("35 minutes ago"));
				it("formats 59 minutes", () => expect(timeSince(MIN * 59)).to.equal("59 minutes ago"));
				it("ignores fractions",  () => {
					expect(timeSince(MIN * 1.5))  .to.equal("A minute ago");
					expect(timeSince(MIN * 1.95)) .to.equal("A minute ago");
					expect(timeSince(MIN * 2.5))  .to.equal("2 minutes ago");
					expect(timeSince(MIN * 2.05)) .to.equal("2 minutes ago");
					expect(timeSince(MIN * 59.5)) .to.equal("59 minutes ago");
				});
			});
			
			describe("Future intervals", () => {
				it("formats 1 minute",   () => expect(timeSince(MIN * -1)).to.equal("A minute from now"));
				it("formats 2 minutes",  () => expect(timeSince(MIN * -2)).to.equal("2 minutes from now"));
				it("formats 10 minutes", () => expect(timeSince(MIN * -10)).to.equal("10 minutes from now"));
				it("formats 35 minutes", () => expect(timeSince(MIN * -35)).to.equal("35 minutes from now"));
				it("formats 59 minutes", () => expect(timeSince(MIN * -59)).to.equal("59 minutes from now"));
				it("ignores fractions",  () => {
					expect(timeSince(MIN * -1.5))  .to.equal("A minute from now");
					expect(timeSince(MIN * -1.95)) .to.equal("A minute from now");
					expect(timeSince(MIN * -2.5))  .to.equal("2 minutes from now");
					expect(timeSince(MIN * -2.05)) .to.equal("2 minutes from now");
					expect(timeSince(MIN * -59.5)) .to.equal("59 minutes from now");
				});
			});
		});
		
		describe("Hours", () => {
			describe("Past intervals", () => {
				it("formats 1 hour",     () => expect(timeSince(HOUR * 1)).to.equal("An hour ago"));
				it("formats 2 hours",    () => expect(timeSince(HOUR * 2)).to.equal("2 hours ago"));
				it("formats 6 hours",    () => expect(timeSince(HOUR * 6)).to.equal("6 hours ago"));
				it("formats 18 hours",   () => expect(timeSince(HOUR * 18)).to.equal("18 hours ago"));
				it("formats 23 hours",   () => expect(timeSince(HOUR * 23)).to.equal("23 hours ago"));
				it("ignores fractions",  () => {
					expect(timeSince(HOUR * 1.5))   .to.equal("An hour ago");
					expect(timeSince(HOUR * 1.95))  .to.equal("An hour ago");
					expect(timeSince(HOUR * 2.5))   .to.equal("2 hours ago");
					expect(timeSince(HOUR * 2.05))  .to.equal("2 hours ago");
					expect(timeSince(HOUR * 11.9))  .to.equal("11 hours ago");
					expect(timeSince(HOUR * 12.01)) .to.equal("12 hours ago");
					expect(timeSince(HOUR * 23.9))  .to.equal("23 hours ago");
				});
			});
			
			describe("Future intervals", () => {
				it("formats 1 hour",     () => expect(timeSince(HOUR * -1)).to.equal("An hour from now"));
				it("formats 2 hours",    () => expect(timeSince(HOUR * -2)).to.equal("2 hours from now"));
				it("formats 6 hours",    () => expect(timeSince(HOUR * -6)).to.equal("6 hours from now"));
				it("formats 18 hours",   () => expect(timeSince(HOUR * -18)).to.equal("18 hours from now"));
				it("formats 23 hours",   () => expect(timeSince(HOUR * -23)).to.equal("23 hours from now"));
				it("ignores fractions",  () => {
					expect(timeSince(HOUR * -1.5))   .to.equal("An hour from now");
					expect(timeSince(HOUR * -1.95))  .to.equal("An hour from now");
					expect(timeSince(HOUR * -2.5))   .to.equal("2 hours from now");
					expect(timeSince(HOUR * -2.05))  .to.equal("2 hours from now");
					expect(timeSince(HOUR * -11.9))  .to.equal("11 hours from now");
					expect(timeSince(HOUR * -12.01)) .to.equal("12 hours from now");
					expect(timeSince(HOUR * -23.9))  .to.equal("23 hours from now");
				});
			});
		});
		
		describe("Days", () => {
			describe("Past intervals", () => {
				it("formats 1 day",      () => expect(timeSince(DAY * 1)).to.equal("Yesterday"));
				it("formats 2 days",     () => expect(timeSince(DAY * 2)).to.equal("2 days ago"));
				it("formats 3 days",     () => expect(timeSince(DAY * 3)).to.equal("3 days ago"));
				it("formats 6 days",     () => expect(timeSince(DAY * 6)).to.equal("6 days ago"));
				it("ignores fractions",  () => {
					expect(timeSince(DAY * 1.1)).to.equal("Yesterday");
					expect(timeSince(DAY * 1.8)).to.equal("Yesterday");
					expect(timeSince(DAY * 2.2)).to.equal("2 days ago");
					expect(timeSince(DAY * 5.5)).to.equal("5 days ago");
					expect(timeSince(DAY * 6.9)).to.equal("6 days ago");
				});
			});
			
			describe("Future intervals", () => {
				it("formats 1 day",      () => expect(timeSince(DAY * -1)).to.equal("Tomorrow"));
				it("formats 2 days",     () => expect(timeSince(DAY * -2)).to.equal("2 days from now"));
				it("formats 3 days",     () => expect(timeSince(DAY * -3)).to.equal("3 days from now"));
				it("formats 6 days",     () => expect(timeSince(DAY * -6)).to.equal("6 days from now"));
				it("ignores fractions",  () => {
					expect(timeSince(DAY * -1.1)).to.equal("Tomorrow");
					expect(timeSince(DAY * -1.8)).to.equal("Tomorrow");
					expect(timeSince(DAY * -2.2)).to.equal("2 days from now");
					expect(timeSince(DAY * -5.5)).to.equal("5 days from now");
					expect(timeSince(DAY * -6.9)).to.equal("6 days from now");
				});
			});
		});
		
		describe("Weeks", () => {
			describe("Past intervals", () => {
				it("formats 1 week",     () => expect(timeSince(WEEK * 1)).to.equal("Last week"));
				it("formats 2 weeks",    () => expect(timeSince(WEEK * 2)).to.equal("2 weeks ago"));
				it("formats 3 weeks",    () => expect(timeSince(WEEK * 3)).to.equal("3 weeks ago"));
				it("formats 4 weeks",    () => expect(timeSince(WEEK * 4)).to.equal("4 weeks ago"));
				it("ignores fractions",  () => {
					expect(timeSince(WEEK * 1.1)).to.equal("Last week");
					expect(timeSince(WEEK * 1.8)).to.equal("Last week");
					expect(timeSince(WEEK * 2.2)).to.equal("2 weeks ago");
					expect(timeSince(WEEK * 4.3)).to.equal("4 weeks ago");
				});
			});
			
			describe("Future intervals", () => {
				it("formats 1 week",     () => expect(timeSince(WEEK * -1)).to.equal("Next week"));
				it("formats 2 weeks",    () => expect(timeSince(WEEK * -2)).to.equal("2 weeks from now"));
				it("formats 3 weeks",    () => expect(timeSince(WEEK * -3)).to.equal("3 weeks from now"));
				it("formats 4 weeks",    () => expect(timeSince(WEEK * -4)).to.equal("4 weeks from now"));
				it("ignores fractions",  () => {
					expect(timeSince(WEEK * -1.1)).to.equal("Next week");
					expect(timeSince(WEEK * -1.8)).to.equal("Next week");
					expect(timeSince(WEEK * -2.2)).to.equal("2 weeks from now");
					expect(timeSince(WEEK * -4.3)).to.equal("4 weeks from now");
				});
			});
		});
		
		describe("Months", () => {
			describe("Past intervals", () => {
				it("formats 1 month",    () => expect(timeSince(MON * 1)).to.equal("Last month"));
				it("formats 2 months",   () => expect(timeSince(MON * 2)).to.equal("2 months ago"));
				it("formats 3 months",   () => expect(timeSince(MON * 3)).to.equal("3 months ago"));
				it("formats 6 months",   () => expect(timeSince(MON * 6)).to.equal("6 months ago"));
				it("formats 11 months",  () => expect(timeSince(MON * 11)).to.equal("11 months ago"));
				it("ignores fractions",  () => {
					expect(timeSince(MON * 1.1)).to.equal("Last month");
					expect(timeSince(MON * 1.8)).to.equal("Last month");
					expect(timeSince(MON * 2.2)).to.equal("2 months ago");
					expect(timeSince(MON * 4.3)).to.equal("4 months ago");
				});
			});
			
			describe("Future intervals", () => {
				it("formats 1 month",    () => expect(timeSince(MON * -1)).to.equal("Next month"));
				it("formats 2 months",   () => expect(timeSince(MON * -2)).to.equal("2 months from now"));
				it("formats 3 months",   () => expect(timeSince(MON * -3)).to.equal("3 months from now"));
				it("formats 6 months",   () => expect(timeSince(MON * -6)).to.equal("6 months from now"));
				it("formats 11 months",  () => expect(timeSince(MON * -11)).to.equal("11 months from now"));
				it("ignores fractions",  () => {
					expect(timeSince(MON * -1.1)).to.equal("Next month");
					expect(timeSince(MON * -1.8)).to.equal("Next month");
					expect(timeSince(MON * -2.2)).to.equal("2 months from now");
					expect(timeSince(MON * -4.3)).to.equal("4 months from now");
				});
			});
		});
		
		describe("Years", () => {
			describe("Past intervals", () => {
				it("formats 1 year",    () => expect(timeSince(YEAR * 1)).to.equal("Last year"));
				it("formats 2 years",   () => expect(timeSince(YEAR * 2)).to.equal("2 years ago"));
				it("formats 3 years",   () => expect(timeSince(YEAR * 3)).to.equal("3 years ago"));
				it("formats 6 years",   () => expect(timeSince(YEAR * 6)).to.equal("6 years ago"));
				it("formats 9 years",   () => expect(timeSince(YEAR * 9)).to.equal("9 years ago"));
				it("ignores fractions",  () => {
					expect(timeSince(YEAR * 1.1)).to.equal("Last year");
					expect(timeSince(YEAR * 1.8)).to.equal("Last year");
					expect(timeSince(YEAR * 2.2)).to.equal("2 years ago");
					expect(timeSince(YEAR * 3.3)).to.equal("3 years ago");
					expect(timeSince(YEAR * 4.3)).to.equal("4 years ago");
					expect(timeSince(YEAR * 9.9)).to.equal("9 years ago");
				});
			});
			
			describe("Future intervals", () => {
				it("formats 1 year",    () => expect(timeSince(YEAR * -1)).to.equal("Next year"));
				it("formats 2 years",   () => expect(timeSince(YEAR * -2)).to.equal("2 years from now"));
				it("formats 3 years",   () => expect(timeSince(YEAR * -3)).to.equal("3 years from now"));
				it("formats 6 years",   () => expect(timeSince(YEAR * -6)).to.equal("6 years from now"));
				it("formats 9 years",   () => expect(timeSince(YEAR * -9)).to.equal("9 years from now"));
				it("ignores fractions",  () => {
					expect(timeSince(YEAR * -1.1)).to.equal("Next year");
					expect(timeSince(YEAR * -1.8)).to.equal("Next year");
					expect(timeSince(YEAR * -2.2)).to.equal("2 years from now");
					expect(timeSince(YEAR * -3.3)).to.equal("3 years from now");
					expect(timeSince(YEAR * -4.3)).to.equal("4 years from now");
					expect(timeSince(YEAR * -9.9)).to.equal("9 years from now");
				});
			});
		});
		
		describe("Decades", () => {
			describe("Past intervals", () => {
				describe("When `maxYear = false`", () => {
					it("formats 1 decade",  () => expect(timeSince(DEC * 1)).to.equal("A decade ago"));
					it("formats 2 decades", () => expect(timeSince(DEC * 2)).to.equal("2 decades ago"));
					it("formats 5 decades", () => expect(timeSince(DEC * 5)).to.equal("5 decades ago"));
					it("formats 9 decades", () => expect(timeSince(DEC * 9)).to.equal("9 decades ago"));
				});
				
				describe("When `maxYear = true`", () => {
					it("formats 10 years", () => expect(timeSince(DEC * 1, true)).to.equal("10 years ago"));
					it("formats 20 years", () => expect(timeSince(DEC * 2, true)).to.equal("20 years ago"));
					it("formats 50 years", () => expect(timeSince(DEC * 5, true)).to.equal("50 years ago"));
					it("formats 90 years", () => expect(timeSince(DEC * 9, true)).to.equal("90 years ago"));
				});
			});
			
			describe("Future intervals", () => {
				describe("When `maxYear = false`", () => {
					it("formats 1 decade",  () => expect(timeSince(DEC * -1)).to.equal("A decade from now"));
					it("formats 2 decades", () => expect(timeSince(DEC * -2)).to.equal("2 decades from now"));
					it("formats 5 decades", () => expect(timeSince(DEC * -5)).to.equal("5 decades from now"));
					it("formats 9 decades", () => expect(timeSince(DEC * -9)).to.equal("9 decades from now"));
				});
				
				describe("When `maxYear = true`", () => {
					it("formats 10 years", () => expect(timeSince(DEC * -1, true)).to.equal("10 years from now"));
					it("formats 20 years", () => expect(timeSince(DEC * -2, true)).to.equal("20 years from now"));
					it("formats 50 years", () => expect(timeSince(DEC * -5, true)).to.equal("50 years from now"));
					it("formats 90 years", () => expect(timeSince(DEC * -9, true)).to.equal("90 years from now"));
				});
			});
		});
		
		describe("Centuries", () => {
			describe("Past intervals", () => {
				describe("When `maxYear = false`", () => {
					it("formats 1 century",   () => expect(timeSince(CENT * 1)).to.equal("A century ago"));
					it("formats 2 centuries", () => expect(timeSince(CENT * 2)).to.equal("2 centuries ago"));
					it("formats 5 centuries", () => expect(timeSince(CENT * 5)).to.equal("5 centuries ago"));
					it("formats 9 centuries", () => expect(timeSince(CENT * 9.1)).to.equal("9 centuries ago"));
				});
				
				describe("When `maxYear = true`", () => {
					it("formats 100 years", () => expect(timeSince(CENT * 1, true)).to.equal("100 years ago"));
					it("formats 200 years", () => expect(timeSince(CENT * 2, true)).to.equal("200 years ago"));
					it("formats 500 years", () => expect(timeSince(CENT * 5, true)).to.equal("500 years ago"));
					it("formats 909 years", () => expect(timeSince(CENT * 9.1, true)).to.equal("909 years ago"));
				});
			});
			
			describe("Future intervals", () => {
				describe("When `maxYear = false`", () => {
					it("formats 1 century",   () => expect(timeSince(CENT * -1)).to.equal("A century from now"));
					it("formats 2 centuries", () => expect(timeSince(CENT * -2)).to.equal("2 centuries from now"));
					it("formats 5 centuries", () => expect(timeSince(CENT * -5)).to.equal("5 centuries from now"));
					it("formats 9 centuries", () => expect(timeSince(CENT * -9.1)).to.equal("9 centuries from now"));
				});
				
				describe("When `maxYear = true`", () => {
					it("formats 100 years", () => expect(timeSince(CENT * -1, true)).to.equal("100 years from now"));
					it("formats 200 years", () => expect(timeSince(CENT * -2, true)).to.equal("200 years from now"));
					it("formats 500 years", () => expect(timeSince(CENT * -5, true)).to.equal("500 years from now"));
					it("formats 909 years", () => expect(timeSince(CENT * -9.1, true)).to.equal("909 years from now"));
				});
			});
		});
		
		describe("Millennia", () => {
			describe("Past intervals", () => {
				describe("When `maxYear = false`", () => {
					it("formats 1 millennium",  () => expect(timeSince(MILL * 1)).to.equal("A millennium ago"));
					it("formats 2 millennia",   () => expect(timeSince(MILL * 2)).to.equal("2 millennia ago"));
					it("formats 5 millennia",   () => expect(timeSince(MILL * 5)).to.equal("5 millennia ago"));
					it("formats 9 millennia",   () => expect(timeSince(MILL * 9)).to.equal("9 millennia ago"));
					it("formats 50 millennia",  () => expect(timeSince(MILL * 50.1)).to.equal("50 millennia ago"));
					it("formats 100 millennia", () => expect(timeSince(MILL * 100.1)).to.equal("100 millennia ago"));
				});
				
				describe("When `maxYear = true`", () => {
					it("formats 1000 years",   () => expect(timeSince(MILL * 1, true)).to.equal("1000 years ago"));
					it("formats 2000 years",   () => expect(timeSince(MILL * 2, true)).to.equal("2000 years ago"));
					it("formats 5000 years",   () => expect(timeSince(MILL * 5, true)).to.equal("5000 years ago"));
					it("formats 9000 years",   () => expect(timeSince(MILL * 9, true)).to.equal("9000 years ago"));
					it("formats 50100 years",  () => expect(timeSince(MILL * 50.1, true)).to.equal("50100 years ago"));
					it("formats 100100 years", () => expect(timeSince(MILL * 100.1, true)).to.equal("100100 years ago"));
				});
			});
			
			describe("Future intervals", () => {
				describe("When `maxYear = false`", () => {
					it("formats 1 millennium",  () => expect(timeSince(MILL * -1)).to.equal("A millennium from now"));
					it("formats 2 millennia",   () => expect(timeSince(MILL * -2)).to.equal("2 millennia from now"));
					it("formats 5 millennia",   () => expect(timeSince(MILL * -5)).to.equal("5 millennia from now"));
					it("formats 9 millennia",   () => expect(timeSince(MILL * -9)).to.equal("9 millennia from now"));
					it("formats 50 millennia",  () => expect(timeSince(MILL * -50.1)).to.equal("50 millennia from now"));
					it("formats 100 millennia", () => expect(timeSince(MILL * -100.1)).to.equal("100 millennia from now"));
				});
				
				describe("When `maxYear = true`", () => {
					it("formats 1000 years",   () => expect(timeSince(MILL * -1, true)).to.equal("1000 years from now"));
					it("formats 2000 years",   () => expect(timeSince(MILL * -2, true)).to.equal("2000 years from now"));
					it("formats 5000 years",   () => expect(timeSince(MILL * -5, true)).to.equal("5000 years from now"));
					it("formats 9000 years",   () => expect(timeSince(MILL * -9, true)).to.equal("9000 years from now"));
					it("formats 50100 years",  () => expect(timeSince(MILL * -50.1, true)).to.equal("50100 years from now"));
					it("formats 100100 years", () => expect(timeSince(MILL * -100.1, true)).to.equal("100100 years from now"));
				});
			});
		});
	});
});