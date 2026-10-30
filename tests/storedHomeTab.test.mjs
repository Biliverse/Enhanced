import assert from "node:assert/strict";
import { rmSync, writeFileSync } from "node:fs";
import { after, beforeEach, test } from "node:test";
import { Storage } from "@nsnanocat/util";
import database from "../src/function/database.mjs";
import setENV from "../src/function/setENV.mjs";
import { Response } from "../src/process/Response.mjs";

globalThis.$argument = {};
const storageFile = `/tmp/biliverse-enhanced-stored-home-tab-${process.pid}.json`;
Storage.dataFile = storageFile;

beforeEach(() => {
	writeFileSync(storageFile, "{}\n");
	Storage.data = null;
	globalThis.$argument = {};
});

after(() => rmSync(storageFile, { force: true }));

test("stored Home.Tab saved as an array keeps its order", () => {
	Storage.setItem("@Biliverse.Enhanced.Settings", { Home: { Tab: ["801", "999999", "774"] } });
	const { Settings } = setENV("Biliverse", "Enhanced", database);
	assert.deepEqual(Settings.Home.Tab, ["801", "999999", "774"]);
});

test("stored Home.Tab saved as a comma-separated string is parsed into an ID list", () => {
	Storage.setItem("@Biliverse.Enhanced.Settings", { Home: { Tab: "2037,545,774" } });
	const { Settings } = setENV("Biliverse", "Enhanced", database);
	assert.deepEqual(Settings.Home.Tab, ["2037", "545", "774"]);
});

test("stored Home.Tab saved as an empty string yields no tabs", () => {
	Storage.setItem("@Biliverse.Enhanced.Settings", { Home: { Tab: "" } });
	const { Settings } = setENV("Biliverse", "Enhanced", database);
	assert.deepEqual(Settings.Home.Tab, []);
});

test("show/tab/v2 applies Bottom and Home.Tab when the stored Home.Tab is a comma-separated string", async () => {
	Storage.setItem("@Biliverse.Enhanced.Settings", { Home: { Tab: "2037,545,774", Tab_default: "2037" }, Bottom: ["home", "dynamic", "mine"] });
	const online = {
		code: 0,
		message: "0",
		data: {
			tab: [{ id: 40, name: "推荐", uri: "bilibili://pegasus/promo", tab_id: "推荐tab", pos: 1 }],
			top: [{ id: 3500, name: "游戏中心", pos: 1 }],
			bottom: [
				{ id: 177, name: "首页", tab_id: "home", pos: 1 },
				{ id: 179, name: "关注", tab_id: "dynamic", pos: 2 },
				{ id: 670, name: "发布", tab_id: "publish", pos: 3 },
				{ id: 3511, name: "会员购", tab_id: "会员购Bottom", pos: 4 },
				{ id: 181, name: "我的", tab_id: "我的Bottom", pos: 5 },
			],
		},
	};
	const response = await Response(
		{
			url: "https://app.bilibili.com/x/resource/show/tab/v2?build=85000000&mobi_app=iphone",
			headers: { "User-Agent": "bili-universal/1" },
		},
		{
			headers: { "Content-Type": "application/json; charset=utf-8" },
			body: JSON.stringify(online),
		},
	);
	const { data } = JSON.parse(response.body);

	assert.deepEqual(
		data.bottom.map(item => item.id),
		["home", "dynamic", "mine"],
	);
	assert.deepEqual(
		data.tab.map(item => item.id),
		[2037, 545, 774],
	);
	assert.equal(data.tab.find(item => item.id === 2037).default_selected, 1);
});
