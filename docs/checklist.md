# WebFast AI 代码生成检查清单

> 本清单用于 AI 生成代码后的自检，确保代码符合 WebFast 前端框架标准。
> 每项检查都必须通过，否则代码不能视为合规。

---

## HTML 结构层检查

### 基础语法

- [ ]  **标签大小写**：所有 HTML 标签名使用小写（`<div>` 而非 `<DIV>`）
- [ ]  **属性大小写**：所有 HTML 属性名使用小写（`class` 而非 `CLASS`）
- [ ]  **属性引号**：所有属性值使用双引号包裹（`class="container"` 而非 `class='container'` 或 `class=container`）
- [ ]  **自闭合标签**：自闭合标签使用 `/` 结尾（`<img />`、`<input />`、`<br />`、`<hr />`）
- [ ]  **标签闭合**：非自闭合标签必须显式闭合（`<div></div>` 而非 `<div>`）
- [ ]  **DOCTYPE**：文档开头必须有 `<!DOCTYPE html>`
- [ ]  **语言属性**：`<html>` 标签必须有 `lang` 属性（如 `lang="zh-CN"`）
- [ ]  **字符编码**：`<head>` 内必须有 `<meta charset="UTF-8">`
- [ ]  **视口设置**：`<head>` 内必须有 `<meta name="viewport" content="width=device-width, initial-scale=1.0">`
- [ ]  **页面标题**：`<head>` 内必须有 `<title>`，且内容描述性唯一

### 语义化标签

- [ ]  **主内容唯一**：每页只有一个 `<main>` 元素
- [ ]  **标题层级**：标题按 h1 → h2 → h3 顺序使用，不跳级
- [ ]  **section 标题**：每个 `<section>` 必须包含标题（h1-h6）
- [ ]  **article 独立**：`<article>` 用于独立完整的内容块（可单独分发）
- [ ]  **nav 范围**：`<nav>` 仅用于主要导航链接组，不用于所有链接
- [ ]  **aside 相关**：`<aside>` 用于间接相关内容，不用于主要内容
- [ ]  **header/footer 嵌套**：`<header>` 和 `<footer>` 不嵌套在 `<address>` 内
- [ ]  **figure 标题**：`<figure>` 包含 `<figcaption>` 或明确说明文字
- [ ]  **time 属性**：`<time>` 有 `datetime` 属性或有效日期文本
- [ ]  **details 摘要**：`<details>` 包含 `<summary>` 作为第一个子元素

### 图像与媒体

- [ ]  **img alt**：所有 `<img>` 必须有 `alt` 属性（装饰性图像可为空 `alt=""`）
- [ ]  **img 尺寸**：`<img>` 有 `width` 和 `height` 属性（防止布局偏移）
- [ ]  **video 控件**：`<video>` 有 `controls` 属性或提供自定义控件
- [ ]  **video 字幕**：视频内容提供 `<track>` 字幕（如适用）
- [ ]  **source 类型**：`<source>` 有 `type` 属性说明 MIME 类型

### 表单

- [ ]  **input 类型**：所有 `<input>` 有 `type` 属性（默认 `text` 不够明确）
- [ ]  **button 类型**：所有 `<button>` 有 `type` 属性（`submit`/`reset`/`button`）
- [ ]  **label 关联**：所有表单控件有 `<label>`（`for` 关联或隐式包裹）或 `aria-label`
- [ ]  **required 提示**：必填字段有 `required` 属性或视觉提示
- [ ]  **autocomplete**：表单字段有合适的 `autocomplete` 值（如 `email`、`name`）
- [ ]  **form 方法**：`<form>` 有 `method` 属性（默认 `get` 可能不安全）

### 链接与交互

- [ ]  **链接目的**：所有 `<a>` 的 `href` 有意义（不滥用 `#`）
- [ ]  **外部链接**：外部链接有 `target="_blank"` 和 `rel="noopener noreferrer"`
- [ ]  **button 与 a 区分**：导航用 `<a>`，操作触发用 `<button>`
- [ ]  **禁用元素**：禁用状态使用 `disabled` 属性或 `aria-disabled`，不单靠样式

### 禁止用法

- [ ]  **无废弃标签**：不使用 `<font>`、`<center>`、`<marquee>`、`<blink>`、`<big>`、`<strike>`
- [ ]  **无内联样式**：不使用 `style` 属性（动态计算值除外）
- [ ]  **无内联脚本**：不使用 `onclick`、`onload` 等内联事件处理器
- [ ]  **无 table 布局**：不使用 `<table>` 进行页面布局
- [ ]  **无 iframe 滥用**：`<iframe>` 有 `title` 属性，不用于广告/追踪

---

## CSS 表现层检查

### 基础规范

- [ ]  **box-sizing**：全局设置 `box-sizing: border-box`
- [ ]  **无 !important**：不使用 `!important` 覆盖样式
- [ ]  **无 ID 选择器**：不使用 `#id` 选择器设置样式（仅用于 JS 定位）
- [ ]  **无元素选择器**：不使用元素选择器单独设置样式（`div { }` 仅用于 reset）
- [ ]  **无内联样式**：HTML 中不使用 `style` 属性
- [ ]  **无 @import**：CSS 中不使用 `@import`（性能差，使用 `<link>`）

### 命名规范

- [ ]  **BEM 命名**：类名使用 BEM 方法（`.block__element--modifier`）
- [ ]  **状态类**：状态类使用 `is-` / `has-` 前缀（`.is-active`、`.has-error`）
- [ ]  **JS 钩子**：JS 操作专用类使用 `js-` 前缀（`.js-toggle-menu`），不加样式
- [ ]  **小写连字符**：类名使用小写和连字符（`.user-profile` 而非 `.userProfile`）

### 布局

- [ ]  **Flexbox 优先**：一维布局优先使用 Flexbox
- [ ]  **Grid 二维**：二维布局使用 CSS Grid
- [ ]  **不滥用 float**：不使用 `float` 进行布局（仅用于文本环绕图片）
- [ ]  **不滥用 position**：不使用 `position: absolute` 进行整体布局
- [ ]  **响应式断点**：使用 `@media` 查询，断点基于内容而非设备

### 单位与颜色

- [ ]  **字体 rem**：字体大小使用 `rem`
- [ ]  **间距 rem**：间距（margin/padding/gap）优先使用 `rem` 或 CSS 变量
- [ ]  **布局百分比**：布局宽度优先使用 `%`、`fr` 或 `vw/vh`
- [ ]  **边框 px**：边框、阴影固定值使用 `px`
- [ ]  **CSS 变量**：颜色使用 CSS 自定义属性（`var(--color-primary)`）
- [ ]  **对比度 AA**：文本颜色与背景对比度 >= 4.5:1（大文本 >= 3:1）
- [ ]  **不单独用颜色**：不单独用颜色传达信息（配合图标/文字）

### 动画与性能

- [ ]  **GPU 加速**：动画优先使用 `transform` 和 `opacity`
- [ ]  **will-change**：复杂动画使用 `will-change`（动画后移除）
- [ ]  **过渡单位**：`transition-duration` 和 `transition-delay` 必须带单位（`ms` 或 `s`）
- [ ]  **减少动画**：支持 `prefers-reduced-motion` 媒体查询

### 禁止用法

- [ ]  **无 * 选择器**：不使用 `* { margin: 0; }` 等全局选择器（性能差）
- [ ]  **无 0px**：值为 0 时不带单位（`margin: 0` 而非 `margin: 0px`）
- [ ]  **无 !important**：不使用 `!important`
- [ ]  **无浏览器前缀**：不使用 `-webkit-`、`-moz-` 等前缀（使用 autoprefixer 或标准属性）

---

## JavaScript 行为层检查

### 语法规范

- [ ]  **const 优先**：优先使用 `const`，需要重新赋值用 `let`
- [ ]  **无 var**：不使用 `var`
- [ ]  **严格等于**：使用 `===` 和 `!==`，不使用 `==` 和 `!=`
- [ ]  **模板字符串**：使用模板字符串代替 `+` 拼接（`` `Hello, ${name}` ``）
- [ ]  **箭头函数**：简单函数使用箭头函数
- [ ]  **解构赋值**：使用解构获取对象/数组属性
- [ ]  **展开运算符**：使用 `...` 进行数组/对象展开和剩余参数
- [ ]  **类定义**：使用 `class` 语法，不用原型链直接操作
- [ ]  **模块化**：使用 ES Modules（`import` / `export`）
- [ ]  **async/await**：异步代码使用 `async/await`，不用 Promise 链式调用
- [ ]  **可选链**：使用 `?.` 安全访问嵌套属性
- [ ]  **空值合并**：使用 `??` 提供默认值（仅在 null/undefined 时）

### DOM 操作

- [ ]  **textContent 安全**：用户输入使用 `textContent`，不用 `innerHTML`
- [ ]  **innerHTML 可信**：`innerHTML` 仅用于可信的 HTML 字符串
- [ ]  **classList API**：使用 `classList.add/remove/toggle`，不用 `className` 字符串操作
- [ ]  **addEventListener**：使用 `addEventListener`，不用内联事件
- [ ]  **事件委托**：大量相似元素使用事件委托
- [ ]  **移除监听**：组件销毁时移除事件监听
- [ ]  **querySelector**：使用 `querySelector` / `querySelectorAll`，不用 `getElementsBy*`（实时集合）

### 禁止用法

- [ ]  **无 eval**：不使用 `eval()`
- [ ]  **无 new Function**：不使用 `new Function()`
- [ ]  **无 with**：不使用 `with` 语句
- [ ]  **无 arguments**：使用剩余参数 `...args` 代替 `arguments`
- [ ]  **无 for...in 数组**：数组遍历使用 `for...of` 或 `forEach`
- [ ]  **无 __proto__**：使用 `Object.getPrototypeOf()` 和 `Object.setPrototypeOf()`
- [ ]  **无 console 残留**：生产代码移除 `console.log`（开发环境除外）
- [ ]  **无 debugger**：生产代码移除 `debugger` 语句

---

## 无障碍（WCAG 2.2 AA）检查

### 键盘可访问

- [ ]  **Tab 聚焦**：所有交互元素可通过 Tab 键聚焦
- [ ]  **焦点顺序**：焦点顺序符合视觉阅读顺序（从左到右，从上到下）
- [ ]  **焦点可见**：有清晰的 `:focus-visible` 样式（outline 或 box-shadow）
- [ ]  **无焦点陷阱**：用户不会陷入某个区域无法 Tab 出去
- [ ]  **跳过链接**：有"跳转到主要内容"链接（长页面）
- [ ]  **Esc 关闭**：模态框/下拉菜单可通过 Esc 键关闭

### 屏幕阅读器

- [ ]  **语义标签**：使用正确的 HTML 语义标签（不用 `<div>` 模拟按钮）
- [ ]  **ARIA 补充**：使用 ARIA 属性补充语义（不替代语义标签）
- [ ]  **ARIA 正确**：ARIA 属性值正确（`role="button"` 不是 `<button>`）
- [ ]  **状态通知**：动态内容更新使用 `aria-live` 区域通知
- [ ]  **隐藏内容**：装饰性内容使用 `aria-hidden="true"`
- [ ]  **landmark**：页面有正确的 landmark（`main`、`nav`、`aside`、`footer`）

### 视觉

- [ ]  **对比度 AA**：正常文本对比度 >= 4.5:1，大文本 >= 3:1
- [ ]  **不依赖颜色**：信息不单独通过颜色传达（有图标/文字/图案辅助）
- [ ]  **文本缩放**：文本可放大到 200% 不丢失内容或功能
- [ ]  **行高**：文本行高 >= 1.5 倍
- [ ]  **段落间距**：段落间距 >= 2 倍字体大小
- [ ]  **字间距**：字间距可调（不固定死）

### 表单

- [ ]  **错误提示**：表单错误有清晰的文本说明（非仅颜色）
- [ ]  **错误关联**：错误提示通过 `aria-describedby` 关联到输入框
- [ ]  **必填提示**：必填字段有明确标识（`*` 或"必填"文字）
- [ ]  **输入辅助**：复杂输入提供示例或格式提示

---

## 安全检查

### Content Security Policy

- [X]  **CSP 设置**：有 CSP 头或 `<meta>` 标签
- [ ]  **script-src**：`script-src` 限制为 `'self'`（禁止内联脚本）
- [ ]  **style-src**：`style-src` 允许 `'self'` 和 `'unsafe-inline'`（如需要）
- [ ]  **object-src**：`object-src` 设置为 `'none'`
- [ ]  **frame-src**：`frame-src` 限制为 `'none'` 或 `'self'`
- [ ]  **upgrade-insecure**：有 `upgrade-insecure-requests` 指令

### XSS 防护

- [ ]  **输入转义**：用户输入插入 DOM 前进行 HTML 转义
- [ ]  **textContent 优先**：用户输入使用 `textContent` 而非 `innerHTML`
- [ ]  **URL 验证**：用户提供的 URL 验证协议（禁止 `javascript:`）
- [ ]  **无内联脚本**：没有 `onclick`、`onload` 等内联事件
- [ ]  **无 eval**：不使用 `eval()` 或 `new Function()`

### 其他安全头

- [ ]  **X-Frame-Options**：设置为 `DENY` 或 `SAMEORIGIN`（防止点击劫持）
- [ ]  **X-Content-Type-Options**：设置为 `nosniff`
- [ ]  **Referrer-Policy**：设置为 `strict-origin-when-cross-origin` 或更严格
- [ ]  **Permissions-Policy**：限制不必要的浏览器 API（相机、麦克风等）

### HTTPS

- [ ]  **资源 HTTPS**：所有外部资源（图片、脚本、API）使用 HTTPS
- [ ]  **无混合内容**：HTTPS 页面不加载 HTTP 资源
- [ ]  **HSTS**：服务器启用 HSTS（`Strict-Transport-Security`）

---

## 性能检查

### 加载性能

- [ ]  **图片优化**：图片使用适当格式（WebP/AVIF）和尺寸
- [ ]  **懒加载**：首屏外图片使用 `loading="lazy"`
- [ ]  **预加载**：关键资源使用 `<link rel="preload">`
- [ ]  **代码分割**：非首屏 JS/CSS 使用动态导入或异步加载
- [ ]  **压缩**：资源启用 Gzip/Brotli 压缩

### 运行性能

- [ ]  **DOM 操作批量**：多次 DOM 操作使用 DocumentFragment 或批量更新
- [ ]  **事件节流**：高频事件（scroll/resize）使用节流/防抖
- [ ]  **动画优化**：动画使用 `requestAnimationFrame`
- [ ]  **内存泄漏**：组件销毁时清理定时器、事件监听、引用

---

## 代码质量检查

### 可读性

- [ ]  **命名清晰**：变量/函数/类名有意义（`fetchUserData` 而非 `fud`）
- [ ]  **函数长度**：函数不超过 50 行（单一职责）
- [ ]  **注释必要**：复杂逻辑有注释，简单代码自注释
- [ ]  **一致风格**：代码风格一致（缩进、空格、引号）

### 可维护性

- [ ]  **单一职责**：每个函数/组件只做一件事
- [ ]  **DRY 原则**：不重复代码（提取公共函数/组件）
- [ ]  **KISS 原则**：保持简单，不过度设计
- [ ]  **错误处理**：异步操作有 try/catch，API 调用有错误处理

---

## 检查流程

1. **生成代码后**：AI 先自行运行上述检查清单
2. **逐项确认**：每项检查必须通过，未通过项必须修复
3. **分类统计**：
   - HTML 检查：__ / 25 通过
   - CSS 检查：__ / 20 通过
   - JavaScript 检查：__ / 15 通过
   - 无障碍检查：__ / 20 通过
   - 安全检查：__ / 15 通过
   - 性能检查：__ / 6 通过
   - 代码质量检查：__ / 6 通过
4. **总分**：__ / 107
5. **阈值**：所有安全检查和 90% 以上其他检查通过视为合规
