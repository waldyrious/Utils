import fs           from "fs";
import childProcess from "child_process";


/**
 * Execute an external command.
 *
 * Resolves to an object with `stdin`, `stdout`, and `code` properties.
 * Rejects with an error if the subprocess emitted an "error" event. 
 *
 * @example exec("sed", ["-e", "s/in/out/"], "input");
 * @param {String}   command          - Executed command
 * @param {String[]} argList          - List of arguments/switches
 * @param {String}  [inputData=null]  - Data piped to stdin
 * @param {String}  [outputPath=""]   - File to write stdout to
 * @param {String}  [encoding="utf8"] - Character encoding
 * @return {Promise}
 */
export async function exec(command, argList = [], inputData = null, outputPath = "", encoding = "utf8"){
	const proc = childProcess.spawn(command, argList, {
		windowsHide: true,
		stdio: outputPath
			? ["pipe", fs.openSync(outputPath, "w"), "pipe"]
			:  "pipe",
	});
	let stdout = "";
	let stderr = "";
	if(null !== inputData){
		proc.stdin.write(inputData, encoding);
		proc.stdin.end();
	}
	if(!outputPath){
		proc.stdout.setEncoding(encoding);
		proc.stdout.on("data", data => stdout += data);
	}
	proc.stderr.setEncoding(encoding);
	proc.stderr.on("data", data => stderr += data);
	return new Promise((resolve, reject) => {
		proc.on("close", code => resolve({code, stdout, stderr}));
		proc.on("error", error => reject(error));
	});
}


/**
 * Execute a pipeline of chained commands.
 *
 * Resolves to an object with `stdin`, `stdout`, and `code` properties
 * derived from the last command that finished executing.
 *
 * @uses {@link exec}
 * @example execChain([["ps", "ax"], ["grep", "ssh"]], stdin);
 * @param {Array[]} commands         - List of commands/argv pairs
 * @param {String} [inputData=null]  - Data piped to stdin
 * @param {String} [outputPath=""]   - File to write stdout to
 * @param {String} [encoding="utf8"] - Character encoding
 * @return {Promise}
 */
export async function execChain(commands, inputData = null, outputPath = ""){
	commands = commands.slice();
	let result = {};
	while(commands.length){
		let command = commands.shift();
		if("string" === typeof command)
			command = [command];
		const [cmd, ...argv] = command;
		const output = commands.length ? "" : outputPath;
		result = await exec(cmd, argv, inputData, output);
		inputData = result.stdout;
	}
	return result;
}


/**
 * Execute a string as an unescaped shell command.
 *
 * @public
 * @example <caption>Shell-like invocation with tagged templates</caption>
 *    import {execString as $} from "./utils.js";
 *    const checksums = await $ `git log --oneline | cut -d' ' -f1`;
 *    const forty     = await $ `printf %s "${checksums}" | wc -l`;
 *
 * @param {String} input
 *    Source of the command(s) to execute.
 *
 * @return {Promise}
 *    Resolves with the command's standard output.
 */
export async function execString(input, ...values){
	input = Array.isArray(input) && Array.isArray(input.raw)
		? input.raw.map((string, index) => string + (values[index] || "")).join("")
		: [input, ...values].join(" ");
	return new Promise((resolve, reject) => {
		childProcess.exec(input, (error, stdout, stderr) => error
			? reject(Object.assign(error, {stdout, stderr}))
			: resolve(stdout));
	});
}


/**
 * Asynchronously read the entirety of standard input.
 *
 * @param {String} [encoding="utf8"]
 * @return {Promise}
 */
export function readStdin(encoding = "utf8"){
	return new Promise(resolve => {
		let input = "";
		process.stdin.setEncoding(encoding);
		process.stdin.on("readable", () => {
			const chunk = process.stdin.read();
			null !== chunk ? input += chunk : resolve(input);
		});
	});
}


/**
 * Replace any occurrences of `$HOME` with a tilde.
 *
 * @example tildify("/Users/johngardner/Labs/Utils") == "~/Labs/Utils"
 * @param {String} input
 * @return {String}
 */
export function tildify(input){
	if("win32" === process.platform)
		return input;
	const home = process.env.HOME + "/";
	return (0 === input.indexOf(home))
		? input.substr(home.length).replace(/^\/?/, "~/")
		: input;
}


/**
 * Locate a program file in the user's $PATH.
 *
 * Resolves with an empty string/array if nothing was found.
 *
 * @example which("curl") == "/usr/bin/curl"
 * @example which("nada") == ""
 * @param {String} name
 * @param {Boolean} [all=false]
 * @return {Promise}
 */
export async function which(name, all = false){
	if(!name) return all ? [] : "";
	const cmdStr = "win32" === process.platform
		? `@for %g in (ECHO ${name.replace(/%/g, "%%")}) do`
			+ " @for %e in (%PATHEXT%) do"
			+ " @for %i in (%g%e) do "
			+ ' @if NOT "%~$PATH:i"=="" echo %~$PATH:i'
		: all
			? "IFS=:; for i in $PATH; do"
				+ ` p="$i/"'${name.replace(/'/g, `'"'"'`)}';`
				+ ' if [ -x "$p" ] && [ -f "$p" ]; then printf "%s\\n" "$p"; fi;'
				+ " done"
			: `command -v '${name.replace(/'/g, `'"'"'`)}' 2>/dev/null || true`;
	const result = await new Promise((resolve, reject) =>
		childProcess.exec(cmdStr, {windowsHide: true}, (error, output) => error
			? reject(error)
			: resolve(output.split(/\r?\n/).filter(Boolean))));
	return all ? result : result[0] || "";
}