import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import database from "../src/function/database.mjs";

const tabConfig = database.Enhanced.Configs.Tab;
const tabPages = ["tab", "top", "bottom", "top_more"].flatMap(group => tabConfig[group]);
const tabEntries = [...tabPages, ...tabConfig.bottom.flatMap(item => item.dialog_items ?? [])];

test("Tab page IDs are readable and uniquely assigned by URI", () => {
	const uriById = new Map();
	const idByUri = new Map();

	for (const page of tabEntries) {
		assert.match(page.id, /^[a-z][a-z0-9_]*$/, `${page.uri} must use a readable ID`);

		if (uriById.has(page.id)) assert.equal(uriById.get(page.id), page.uri, `ID ${page.id} cannot identify multiple URIs`);
		else uriById.set(page.id, page.uri);

		if (idByUri.has(page.uri)) assert.equal(idByUri.get(page.uri), page.id, `${page.uri} must always use one ID`);
		else idByUri.set(page.uri, page.id);
	}

	assert.equal(uriById.size, idByUri.size);
});

test("Tab configuration contains every URI shared by domestic and international clients", () => {
	const configuredURIs = new Set(tabPages.map(page => page.uri));
	const sharedURIs = ["bilibili://live/home", "bilibili://pegasus/promo", "bilibili://pegasus/hottopic", "bilibili://pgc/home", "bilibili://main/home/", "bilibili://pegasus/channel/", "bilibili://following/home/", "bilibili://user_center/", "bilibili://link/im_home", "bilibili://main/top_category"];

	for (const uri of sharedURIs) assert.ok(configuredURIs.has(uri), `${uri} must be configurable`);
});

test("Default settings reference readable Tab page IDs", () => {
	const { Settings, Configs } = database.Enhanced;
	const ids = {
		tab: new Set(Configs.Tab.tab.map(item => item.id)),
		top: new Set(Configs.Tab.top.map(item => item.id)),
		top_more: new Set(Configs.Tab.top_more.map(item => item.id)),
		bottom: new Set(Configs.Tab.bottom.map(item => item.id)),
	};

	for (const id of Settings.Home.Tab) assert.ok(ids.tab.has(id));
	for (const id of Settings.Home.Top) assert.ok(ids.top.has(id));
	for (const id of Settings.Home.Top_more) assert.ok(ids.top_more.has(id));
	for (const id of Settings.Bottom) assert.ok(ids.bottom.has(id));
	assert.ok(ids.tab.has(Settings.Home.Tab_default));
});

test("Tab endpoint uses request scripts in every platform template", () => {
	const templates = ["surge.handlebars", "surge.dev.handlebars", "loon.handlebars", "loon.dev.handlebars", "quantumultx.handlebars", "quantumultx.dev.handlebars", "shadowrocket.handlebars", "stash.handlebars", "stash.dev.handlebars"];

	for (const template of templates) {
		const content = readFileSync(new URL(`../template/${template}`, import.meta.url), "utf8");
		const lines = content.split("\n");
		const index = lines.findIndex(line => line.includes("/x\\/resource\\/show\\/tab\\/v2"));
		assert.notEqual(index, -1, `${template} must contain the Tab endpoint`);
		const block = lines.slice(index, template.startsWith("stash") ? index + 4 : index + 1).join("\n");
		if (template.startsWith("quantumultx")) assert.match(block, /script-echo-response/);
		else assert.match(block, /http-request|type: request/);
		assert.doesNotMatch(block, /response\.bundle|response\.dev\.bundle|script-response-body|http-response|type: response/);
	}
});
