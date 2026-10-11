import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import pkg from "../package.json" with { type: "json" };
import { homeTab } from "../arguments-builder.PreferencePanes.config.ts";

export async function preparePreferencePanes(path) {
	const settings = JSON.parse(await readFile(path, "utf8"));
	const filteredSettings = settings.filter(({ id }) => id !== homeTab.id);
	const tabDefaultIndex = filteredSettings.findIndex(({ id }) => id === "@Biliverse.Enhanced.Settings.Home.Tab_default");
	if (tabDefaultIndex < 0) throw new Error(`Missing Home.Tab_default in ${path}`);
	filteredSettings.splice(tabDefaultIndex, 0, homeTab);
	await writeFile(path, JSON.stringify(filteredSettings));
}

/**
 * 打包确定提交中的专用资源，共用框架仍由 PreferencePanes 提供。
 * Package content from an immutable revision; PreferencePanes still supplies the shared framework.
 * @param {string} revision 内容仓库的完整提交号 / Full commit SHA of the content repository.
 * @returns {Promise<void>} 专用资源写入 dist / Writes the dedicated resources to dist.
 */
export async function packagePreferencePanesAssets(revision) {
	if (!/^[a-f\d]{40}$/.test(revision)) throw new Error("PreferencePanes content requires a full commit SHA");
	const base = new URL(`https://raw.githubusercontent.com/Biliverse/Biliverse.github.io/${revision}/settings/`);
	const response = await fetch(new URL("home.json", base));
	if (!response.ok) throw new Error(`PreferencePanes home.json: HTTP ${response.status}`);
	const home = Buffer.from(await response.arrayBuffer());
	const config = JSON.parse(home);
	const images = new Set([config.logo, ...config.sections.flatMap(section => section.items.map(item => item.icon?.src))].filter(Boolean));
	const resources = new Map([["home.json", home]]);
	const files = ["theme.css", "bridge.mjs"];
	for (const image of images) {
		const url = new URL(image, base);
		if (url.origin !== base.origin) continue;
		if (!url.href.startsWith(`${base.href}assets/`)) throw new Error(`Local homepage image must be inside settings/assets: ${image}`);
		files.push(url.href.slice(base.href.length));
	}
	for (const file of files) {
		const response = await fetch(new URL(file, base));
		if (!response.ok) throw new Error(`PreferencePanes ${file}: HTTP ${response.status}`);
		resources.set(path.basename(file), Buffer.from(await response.arrayBuffer()));
	}
	await mkdir("dist", { recursive: true });
	await Promise.all([...resources].map(([name, body]) => writeFile(path.join("dist", name), body)));
	console.log(`PreferencePanes content: ${revision} (${resources.size} files)`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
	await preparePreferencePanes(process.argv[2]);
	await packagePreferencePanesAssets(pkg.preferencePanesContentRevision);
}
