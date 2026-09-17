import { RegionShortcutReq } from "@biliverse/protobuf/bilibili/app/show/v1/mixture.js";
import gRPC from "@nsnanocat/grpc";
import { $app, Storage } from "@nsnanocat/util";

/**
 * 分区响应转换器。
 * Region response transformer.
 */
export default class Region {
	/**
	 * 保存客户端提交的自定义快捷访问。
	 * Save client-submitted custom shortcuts.
	 * @param {object} request - 原始请求 / Original request.
	 * @param {object} settings - 模块设置 / Module settings.
	 * @returns {void} 无返回值 / No return value.
	 */
	static saveShortcuts(request, settings) {
		const rawBody = $app === "Quantumult X" ? new Uint8Array(request.bodyBytes ?? []) : (request.body ?? new Uint8Array());
		settings.Home.Tab = RegionShortcutReq.fromBinary(gRPC.decode(rawBody)).uniqueId;
		Storage.setItem("@BiliBili.Enhanced.Settings", settings);
	}

	/**
	 * 合并线上与本地分区列表。
	 * Merge online and local region lists.
	 * @param {Array<object>} onlineContents - 线上分区列表 / Online region list.
	 * @param {object} localRegionList - 本地分区配置 / Local region configuration.
	 * @returns {Array<object>} 合并后的分区列表 / Merged region list.
	 */
	static mergeLists(onlineContents, localRegionList) {
		const contents = onlineContents.map(content => ({ ...content, icons: [...content.icons] }));
		const groups = new Map(contents.map(content => [content.title, content]));
		const uniqueIds = new Set(contents.flatMap(content => content.icons.map(icon => icon.uniqueId)));
		for (const group of localRegionList.groups) {
			const content = groups.get(group.title) ?? { title: group.title, icons: [] };
			for (const uniqueId of group.ids) {
				if (uniqueIds.has(uniqueId)) continue;
				const item = localRegionList.items[uniqueId];
				content.icons.push({ img: item.img, title: item.title, url: item.url, uniqueId, rid: item.rid });
				uniqueIds.add(uniqueId);
			}
			groups.set(group.title, content);
		}
		const configuredTitles = new Set(localRegionList.groups.map(group => group.title));
		return [...localRegionList.groups.map(group => groups.get(group.title)), ...contents.filter(content => !configuredTitles.has(content.title))];
	}

	/**
	 * 构造自定义快捷访问图标。
	 * Build custom shortcut icons.
	 * @param {string[]} uniqueIds - 分区唯一标识列表 / Region unique identifier list.
	 * @param {object} regionList - 分区配置 / Region configuration.
	 * @returns {Array<object>} 快捷访问图标 / Shortcut icons.
	 */
	static buildShortcutIcons(uniqueIds, regionList) {
		return uniqueIds
			.map(uniqueId => {
				const item = regionList.items[uniqueId];
				if (!item) return;
				return { img: item.img, title: item.title, url: item.url, uniqueId, rid: item.rid };
			})
			.filter(Boolean);
	}

	/**
	 * 用配置替换分区页索引。
	 * Replace region page index with configuration.
	 * @param {Array<object>} data - 分区页索引 / Region page index.
	 * @param {string} pathname - 请求路径 / Request pathname.
	 * @param {object} settings - 分区设置 / Region settings.
	 * @param {object} configs - 分区数据配置 / Region data configuration.
	 * @returns {Array<object>} 替换后的分区页索引 / Replaced region page index.
	 */
	static replaceIndex(data, pathname, settings, configs) {
		// 分区页面索引。
		// Region page index.
		// 末尾插入全部分区。
		// Append all regions at the end.
		data.push(...configs.index, ...configs.modify);
		// 数组去重。
		// Deduplicate the array.
		const uniqueItems = new Map();
		data = data.filter(item => !uniqueItems.has(item.tid) && uniqueItems.set(item.tid, 1));
		// 排序。
		// Sort.
		data = data.sort((first, second) => first.tid - second.tid);
		// 过滤。
		// Filter.
		data = data.filter(item => settings.Index.includes(item.tid));
		// 特殊处理。
		// Special handling.
		switch (pathname) {
			case "/x/v2/region/index":
				break;
			case "/x/v2/channel/region/list":
				data = data.map(item => {
					if (item.goto === "0") item.goto = "";
					item.children = undefined;
					item.config = undefined;
					return item;
				});
				break;
		}
		return data;
	}
}
