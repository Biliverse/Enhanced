import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import { configAsset } from "../rollup.config.mjs";
import { packagePreferencePanesAssets } from "../scripts/prepare-preference-panes.mjs";

test("content packaging pins every download, preserves binary files and fails before publishing incomplete assets", async () => {
	const root = await mkdtemp(path.join(tmpdir(), "enhanced-content-"));
	const original = process.cwd();
	const fetch = globalThis.fetch;
	const revision = "a".repeat(40);
	const base = `https://raw.githubusercontent.com/Biliverse/Biliverse.github.io/${revision}/settings/`;
	const home = JSON.stringify({ logo: "assets/logo.png", sections: [{ items: [{ icon: { src: "assets/logo.png" } }, { icon: { src: "https://example.com/icon.png" } }] }] });
	const image = Buffer.from([137, 80, 78, 71, 0, 255]);
	const content = new Map([["home.json", home], ["theme.css", "body { color: pink; }"], ["bridge.mjs", "export default () => {};"], ["assets/logo.png", image]]);
	const requests = [];
	let failure;
	globalThis.fetch = async url => {
		assert.ok(url.href.startsWith(base));
		requests.push(url.href);
		const file = url.href.slice(base.length);
		return new Response(file === failure ? "Unavailable" : content.get(file), { status: file === failure ? 503 : 200 });
	};
	try {
		process.chdir(root);
		await assert.rejects(packagePreferencePanesAssets("main"), /full commit SHA/);
		assert.equal(requests.length, 0);
		await packagePreferencePanesAssets(revision);
		assert.deepEqual((await readdir("dist")).sort(), ["bridge.mjs", "home.json", "logo.png", "theme.css"]);
		assert.equal(await readFile("dist/home.json", "utf8"), home);
		assert.deepEqual(await readFile("dist/logo.png"), image);
		assert.equal(requests.filter(url => url.endsWith("logo.png")).length, 1);
		await rm("dist", { recursive: true });
		for (failure of ["home.json", "bridge.mjs", "assets/logo.png"]) {
			await assert.rejects(packagePreferencePanesAssets(revision), /HTTP 503/);
			await assert.rejects(readdir("dist"), { code: "ENOENT" });
		}
	} finally {
		globalThis.fetch = fetch;
		process.chdir(original);
		await rm(root, { recursive: true, force: true });
	}
});

test("both release channels compile configuration responses from their own JSON artifact", async () => {
	const root = await mkdtemp(path.join(tmpdir(), "enhanced-artifacts-"));
	const original = process.cwd();
	try {
		await mkdir(path.join(root, "dist"));
		process.chdir(root);
		for (const suffix of ["", ".dev"]) {
			const json = [{ id: "@Root.Module.Settings.flag", name: suffix || "release", type: "boolean", val: true }];
			await writeFile(`dist/Biliverse.Enhanced${suffix}.PreferencePanes.json`, JSON.stringify(json));
			const files = new Map();
			await configAsset(suffix).generateBundle.call({ emitFile: ({ fileName, source }) => files.set(fileName, source) });
			assert.deepEqual([...files.keys()], [`config${suffix}.bundle.js`]);
			const response = await new Promise(resolve =>
				vm.runInNewContext(files.get(`config${suffix}.bundle.js`), {
					$environment: { "surge-version": "test" },
					$script: { startTime: Date.now() / 1000 },
					$request: { url: "https://biliverse.github.io/api/Enhanced", method: "GET" },
					$done: result => resolve(result.response),
					console: { log() {}, error() {} },
				}),
			);
			assert.equal(response.status, 200);
			assert.ok(response.headers["X-PreferencePanes-Version"]);
			assert.deepEqual(JSON.parse(response.body), json);
			const head = await new Promise(resolve =>
				vm.runInNewContext(files.get(`config${suffix}.bundle.js`), {
					$environment: { "surge-version": "test" },
					$script: { startTime: Date.now() / 1000 },
					$request: { url: "https://biliverse.github.io/api/Enhanced", method: "HEAD" },
					$done: result => resolve(result.response),
					console: { log() {}, error() {} },
				}),
			);
			assert.equal(head.status, 200);
			assert.equal(head.body, "");
		}
	} finally {
		process.chdir(original);
		await rm(root, { recursive: true, force: true });
	}
});
