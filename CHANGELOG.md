# Unreleased

### 🛠️ Bug Fixes

	* 将 BoxJs v1 与 PreferencePanes v2 配置拆分为独立 JSON 产物，避免将不支持的设置类型发布到 BoxJs。
	* 恢复 BoxJs 首页标签页复选框，并兼容其旧版标签页、顶栏和底栏设置值。

# v0.6.0

### 🔄 Other Changes

  * 升级 `@nsnanocat/util`。
  * 持久化储存空间由 `BiliBili` 更名为 `Biliverse`；既有设置与缓存不会继续读取。
  * BoxJS 自动生成的配置面板与 Biliverse 聚合面板统一使用新的储存空间。
  * 适配新版 Enhanced 分区页、快捷访问与首页标签页联动。

### 🛠️ Bug Fixes

  * 修复 Stash 分区列表规则引用不存在脚本提供方而导致覆写无法加载的问题。
  * 修复 Loon 未按旧版 URL `data-path` 语法拉取远程资源再本地 Mock 的问题。
