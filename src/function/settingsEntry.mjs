const uri = "https://biliverse.github.io/settings/";

export function addSettingsEntry(data, ipad = false) {
	const groups = ipad
		? [data.ipad_upper_sections, data.ipad_recommend_sections, data.ipad_more_sections]
		: data.sections_v2?.map(section => section.items) ?? [];
	for (const items of groups) {
		if (!Array.isArray(items)) continue;
		const index = items.findIndex(item => item.uri === "bilibili://user_center/setting");
		if (index < 0) continue;
		const existing = items.findIndex(item => item.uri === uri);
		if (existing >= 0) items.splice(existing, 1);
		const settingIndex = items.findIndex(item => item.uri === "bilibili://user_center/setting");
		items.splice(settingIndex + 1, 0, {
			id: 129515498,
			title: "Biliverse 设置",
			icon: "https://biliverse.github.io/settings/logo.png",
			uri,
			common_op_item: {},
		});
		return;
	}
}
