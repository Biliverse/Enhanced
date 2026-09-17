import { Console } from "@nsnanocat/util";

/**
 * 我的页响应转换器。
 * Mine page response transformer.
 */
export default class Mine {
	/**
	 * 我的页固定入口配置。
	 * Mine page fixed entry configuration.
	 */
	static #Config = {
		BaseURI: "https://app.bilibili.com/settings/",
		SettingsURI: "bilibili://user_center/setting",
		URI: "bilibili://web/general?url=https%3A%2F%2Fapp.bilibili.com%2Fsettings%2F",
	};

	/**
	 * 用配置替换我的页服务分组。
	 * Replace Mine page service sections with configuration.
	 * @param {object} data - 我的页响应数据 / Mine page response data.
	 * @param {object} settings - 我的页设置 / Mine page settings.
	 * @param {object} configs - 我的页数据配置 / Mine page data configuration.
	 * @param {boolean} debug - 是否输出开发调试信息 / Whether to emit development debug output.
	 * @returns {void} 无返回值 / No return value.
	 */
	static replaceSections(data, settings, configs, debug = false) {
		data.sections_v2 = configs.sections_v2.map(section => {
			if (debug) Console.debug(`e.title = ${section.title}`);
			switch (section.title) {
				case "创作中心":
					section.items = section.items.filter(item => settings.CreatorCenter.includes(item.id));
					break;
				case "推荐服务":
					section.items = section.items.filter(item => settings.Recommend.includes(item.id));
					break;
				case "更多服务":
					section.items = section.items.filter(item => settings.More.includes(item.id));
					break;
			}
			if (!section.items.some(() => true)) section = {};
			return section;
		});
	}

	/**
	 * 用配置替换 iPad 我的页服务分组。
	 * Replace iPad Mine page service sections with configuration.
	 * @param {object} data - iPad 我的页响应数据 / iPad Mine page response data.
	 * @param {object} settings - iPad 我的页设置 / iPad Mine page settings.
	 * @param {object} configs - iPad 我的页数据配置 / iPad Mine page data configuration.
	 * @returns {void} 无返回值 / No return value.
	 */
	static replacePadSections(data, settings, configs) {
		data.ipad_upper_sections = configs.ipad_upper_sections.filter(item => settings.Upper.includes(item.id));
		data.ipad_recommend_sections = configs.ipad_recommend_sections.filter(item => settings.Recommend.includes(item.id));
		data.ipad_more_sections = configs.ipad_more_sections.filter(item => settings.More.includes(item.id));
	}

	/**
	 * 在原生设置入口之后写入 Biliverse 哔哩万象入口。
	 * Insert the Biliverse entry after the native Settings entry.
	 * @param {object} data - 我的页响应数据 / Mine page response data.
	 * @param {boolean} ipad - 是否为 iPad 响应 / Whether this is an iPad response.
	 * @returns {void} 无返回值 / No return value.
	 */
	static addEntry(data, ipad = false) {
		const groups = ipad ? [data.ipad_upper_sections, data.ipad_recommend_sections, data.ipad_more_sections] : (data.sections_v2?.map(section => section.items) ?? []);
		for (const items of groups) {
			if (!Array.isArray(items)) continue;
			for (let index = items.length - 1; index >= 0; index--) {
				if (items[index].id === 129515498 || items[index].uri === Mine.#Config.URI || [Mine.#Config.BaseURI, "https://biliverse.github.io/settings/"].includes(items[index].uri?.split(/[?#]/)[0])) items.splice(index, 1);
			}
		}
		const items = groups.find(items => Array.isArray(items) && items.some(item => item.uri === Mine.#Config.SettingsURI));
		if (!items) return;
		const settingsIndex = items.findIndex(item => item.uri === Mine.#Config.SettingsURI);
		items.splice(settingsIndex + 1, 0, {
			id: 129515498,
			title: "Biliverse 哔哩万象",
			icon: "https://biliverse.github.io/settings/assets/Biliverse_subject.png",
			uri: Mine.#Config.URI,
			common_op_item: {},
		});
	}
}
