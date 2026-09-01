import assert from "node:assert/strict";
import test from "node:test";
import HonoWorkerAdapter from "../src/class/HonoWorkerAdapter.mjs";
import { Response } from "../src/process/Response.mjs";

test("rewrites Pages and Workers paths to the original upstream host", () => {
	const pages = HonoWorkerAdapter.routeRewrite(new URL("https://enhanced-cdt.pages.dev/app.bilibili.com/x/resource/show/tab/v2"), "app.bilibili.com/x/resource/show/tab/v2");
	assert.equal(pages.toString(), "https://app.bilibili.com/x/resource/show/tab/v2");

	const workers = HonoWorkerAdapter.routeRewrite(new URL("https://enhanced.nanocat.workers.dev/app.biliapi.net/x/v2/account/mine"), "app.biliapi.net/x/v2/account/mine");
	assert.equal(workers.toString(), "https://app.biliapi.net/x/v2/account/mine");
});

test("extracts module arguments from the transport header", () => {
	const request = {
		url: "https://app.bilibili.com/x/resource/show/tab/v2",
		headers: { "biliverse-args": "Home.Switch=false" },
	};
	HonoWorkerAdapter.buildArgument(request);
	assert.deepEqual(globalThis.$argument, { Home: { Switch: "false" } });
	assert.deepEqual(request.headers, {});
});

test("removes module settings from the upstream query", () => {
	const request = {
		url: "https://app.bilibili.com/x/resource/show/tab/v2?Home.Switch=false&Mine.Switch=false&foo=bar",
		headers: {},
	};
	HonoWorkerAdapter.buildArgument(request);
	assert.deepEqual(globalThis.$argument, { Home: { Switch: "false" }, Mine: { Switch: "false" }, foo: "bar" });
	assert.equal(request.url, "https://app.bilibili.com/x/resource/show/tab/v2?foo=bar");
});

test("returns an unchanged response when the matching feature is disabled", async () => {
	HonoWorkerAdapter.buildArgument({
		url: "https://app.bilibili.com/x/resource/show/tab/v2",
		headers: { "biliverse-args": "Home.Switch=false&LogLevel=OFF" },
	});
	const response = {
		status: 200,
		headers: { "content-type": "application/json" },
		body: JSON.stringify({ code: 0, message: "0", data: { sentinel: true } }),
	};
	const result = await Response({ url: "https://app.bilibili.com/x/resource/show/tab/v2" }, response);
	assert.equal(result, response);
	assert.deepEqual(JSON.parse(result.body), { code: 0, message: "0", data: { sentinel: true } });
});
