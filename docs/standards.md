# WebFast 面向 AI 生成代码的前端框架标准

> 版本：1.0
> 制定日期：2026-06-14
> 适用范围：WebFast 框架及所有基于原生 Web 技术栈的 AI 生成代码

## 标准体系总览

| 层面 | 标准来源 | 制定组织 | 文档状态 |
|------|---------|---------|---------|
| 结构层 | HTML Living Standard | WHATWG | 持续更新（Living Standard） |
| 表现层 | CSS 各模块规范 | W3C CSS WG | 推荐标准（REC）/ 工作草案（WD） |
| 行为层 | ECMAScript 2025 | TC39 / Ecma International | 已发布标准（2025年6月） |
| Web API | DOM、Fetch、Canvas 等 | W3C / WHATWG | 推荐标准 |
| 无障碍 | WCAG 2.2 | W3C WAI | W3C Recommendation（2024年12月） |
| 安全 | CSP Level 3 | W3C WebAppSec WG | 工作草案（2025年2月） |

---

## 1. 结构层：HTML（WHATWG Living Standard）

### 1.1 标准来源与地位

- **主规范**：[HTML Living Standard](https://html.spec.whatwg.org/)（WHATWG）
- **W3C 关系**：2019年 W3C 与 WHATWG 签署谅解备忘录（MOU），W3C 停止独立制定 HTML 标准，全面采纳 WHATWG 的 Living Standard。W3C 发布的 HTML 5.x 文档仅为 WHATWG Living Standard 的"快照"（Snapshot）。
- **AI 编码原则**：AI 生成 HTML 代码时，应以 WHATWG Living Standard 为唯一权威来源，而非过时的 W3C HTML5 规范。

### 1.2 标签语义规范

AI 必须根据内容语义选择标签，禁止仅基于默认样式选择标签。

| 标签 | 语义用途 | 允许内容 | 禁止用法 |
|------|---------|---------|---------|
| `<header>` | 页面/区块的头部 | 导航、标题、logo | 不能嵌套在 `<footer>`、`<address>` 内 |
| `<nav>` | 主要导航链接组 | 链接列表 | 不能用于所有链接组，仅用于主要导航 |
| `<main>` | 页面主要内容（每页唯一） | 文档核心内容 | 每页只能出现一次 |
| `<article>` | 独立完整的内容块 | 文章、帖子、评论 | 不能用于非独立内容 |
| `<section>` | 主题性内容分组 | 带标题的内容区块 | 必须包含标题（h1-h6） |
| `<aside>` | 间接相关的内容 | 侧边栏、引用、广告 | 不能用于主要内容 |
| `<footer>` | 页面/区块的尾部 | 版权、作者、相关链接 | 不能嵌套在 `<header>`、`<address>` 内 |
| `<address>` | 联系信息 | 作者/拥有者联系信息 | 不能用于任意地址 |
| `<figure>` | 自包含的内容单元 | 图片、代码、图表 + `<figcaption>` | 必须包含 `<figcaption>` 或说明文字 |
| `<figcaption>` | `<figure>` 的标题 | 文本内容 | 必须是 `<figure>` 的第一个或最后一个子元素 |
| `<time>` | 日期/时间 | 机器可读的时间值 | 必须包含 `datetime` 属性或有效日期文本 |
| `<mark>` | 高亮标记 | 被引用的文本片段 | 不能用于单纯的高亮样式 |
| `<details>` | 可展开详情 | `<summary>` + 内容 | 必须包含 `<summary>` |
| `<summary>` | `<details>` 的标题 | 文本/短语内容 | 必须是 `<details>` 的第一个子元素 |

### 1.3 语法规则

#### 1.3.1 标签闭合

- **自闭合标签**：必须使用自闭合语法（HTML5 允许省略斜杠，但为 XML 兼容性建议保留）：
  ```html
  <!-- 正确 -->
  <img src="photo.jpg" alt="描述" />
  <input type="text" />
  <br />
  <hr />
  
  <!-- 错误 -->
  <img src="photo.jpg" alt="描述">
  <input type="text">
  ```

- **非自闭合标签**：必须显式闭合：
  ```html
  <!-- 正确 -->
  <div class="container"></div>
  <p>这是一个段落。</p>
  
  <!-- 错误 -->
  <div class="container">
  <p>这是一个段落。
  ```

#### 1.3.2 大小写规则

- **标签名**：必须小写
  ```html
  <!-- 正确 -->
  <div class="content"></div>
  
  <!-- 错误 -->
  <DIV class="content"></DIV>
  <Div class="content"></Div>
  ```

- **属性名**：必须小写
  ```html
  <!-- 正确 -->
  <input type="text" name="username" />
  
  <!-- 错误 -->
  <input TYPE="text" NAME="username" />
  ```

#### 1.3.3 引号使用

- **属性值**：必须使用双引号包裹（即使值中不含空格）
  ```html
  <!-- 正确 -->
  <div class="container" id="main"></div>
  <input type="checkbox" checked="checked" />
  
  <!-- 错误 -->
  <div class='container' id='main'></div>
  <div class=container id=main></div>
  ```

- **布尔属性**：可省略属性值，但建议显式写出：
  ```html
  <!-- 推荐 -->
  <input type="checkbox" checked="checked" disabled="disabled" />
  
  <!-- 允许但不推荐 -->
  <input type="checkbox" checked disabled />
  ```

### 1.4 嵌套规则

#### 1.4.1 块级与行内元素

- **块级元素**（`<div>`, `<p>`, `<section>` 等）可以包含其他块级元素和行内元素
- **行内元素**（`<span>`, `<a>`, `<em>` 等）不能包含块级元素
- **特殊规则**：
  - `<p>` 不能包含 `<div>`, `<p>`, `<h1>`-`<h6>`, `<ul>`, `<ol>`, `<table>` 等块级元素
  - `<a>` 不能包含其他交互元素（`<a>`, `<button>`, `<input>`, `<textarea>`, `<select>`）
  - `<button>` 不能包含 `<a>` 或另一个 `<button>`

#### 1.4.2 标题层级

- 标题必须按层级顺序使用，不得跳级：
  ```html
  <!-- 正确 -->
  <h1>文章标题</h1>
  <h2>章节标题</h2>
  <h3>小节标题</h3>
  
  <!-- 错误 -->
  <h1>文章标题</h1>
  <h3>章节标题</h3>  <!-- 跳过 h2 -->
  ```

- 每个 `<section>` / `<article>` 内可以重新开始标题层级：
  ```html
  <!-- 正确 -->
  <article>
    <h2>文章标题</h2>  <!-- 在 article 内，h2 是允许的 -->
  </article>
  ```

#### 1.4.3 列表嵌套

- `<ul>` / `<ol>` 的直接子元素必须是 `<li>`
- `<li>` 内可以包含任意流内容（包括其他列表）：
  ```html
  <!-- 正确 -->
  <ul>
    <li>项目一
      <ul>
        <li>子项目</li>
      </ul>
    </li>
  </ul>
  
  <!-- 错误 -->
  <ul>
    <div>项目一</div>  <!-- 不能直接用 div -->
  </ul>
  ```

#### 1.4.4 表格嵌套

- `<table>` 的子元素必须是 `<caption>`, `<colgroup>`, `<thead>`, `<tbody>`, `<tfoot>`, `<tr>`（在特定上下文中）
- `<tr>` 的直接子元素必须是 `<th>` 或 `<td>`

### 1.5 合法属性及值范围

#### 1.5.1 全局属性（所有 HTML 元素可用）

| 属性 | 允许值 | 用途 |
|------|-------|------|
| `class` | 空格分隔的 CSS 类名 | 样式钩子 |
| `id` | 唯一标识符（页面内唯一） | 脚本/锚点定位 |
| `style` | CSS 声明（**禁止内联样式**） | 仅用于动态计算值 |
| `title` | 任意文本 | 工具提示 |
| `data-*` | 任意小写属性名 | 自定义数据存储 |
| `hidden` | 布尔属性 | 隐藏元素 |
| `tabindex` | 整数（-1 或 0+） | 焦点顺序 |
| `role` | ARIA 角色值 | 无障碍语义补充 |
| `aria-*` | ARIA 属性值 | 无障碍属性 |

#### 1.5.2 表单元素属性

| 元素 | 属性 | 允许值 | 说明 |
|------|------|-------|------|
| `<input>` | `type` | text, email, password, number, tel, url, search, date, datetime-local, time, week, month, checkbox, radio, file, hidden, submit, reset, button, image, color, range | 必须指定 |
| `<input>` | `required` | 布尔 | 必填字段 |
| `<input>` | `pattern` | 正则表达式 | 输入验证 |
| `<input>` | `min` / `max` | 数字/日期 | 范围限制 |
| `<input>` | `placeholder` | 文本 | 提示文本 |
| `<input>` | `autocomplete` | on, off, name, email, username, new-password, current-password, one-time-code, organization, street-address, address-line1, address-line2, address-line3, address-level4, address-level3, address-level2, address-level1, country, country-name, postal-code, cc-name, cc-given-name, cc-additional-name, cc-family-name, cc-number, cc-exp, cc-exp-month, cc-exp-year, cc-csc, cc-type, transaction-currency, transaction-amount, language, bday, bday-day, bday-month, bday-year, sex, tel, tel-country-code, tel-national, tel-area-code, tel-local, tel-local-prefix, tel-local-suffix, tel-extension, impp, url, photo | 自动填充提示 |
| `<form>` | `method` | get, post, dialog | 提交方法 |
| `<form>` | `action` | URL | 提交目标 |
| `<form>` | `enctype` | application/x-www-form-urlencoded, multipart/form-data, text/plain | 编码类型 |
| `<button>` | `type` | submit, reset, button | 必须指定（默认 submit） |
| `<textarea>` | `rows` | 正整数 | 行数 |
| `<textarea>` | `cols` | 正整数 | 列数 |
| `<select>` | `multiple` | 布尔 | 多选 |
| `<select>` | `size` | 正整数 | 可见选项数 |

#### 1.5.3 媒体元素属性

| 元素 | 属性 | 允许值 | 说明 |
|------|------|-------|------|
| `<img>` | `src` | URL | 图像源（必须） |
| `<img>` | `alt` | 文本 | 替代文本（必须， decorative 图像可为空） |
| `<img>` | `width` / `height` | 正整数（像素） | 固有尺寸（防止布局偏移） |
| `<img>` | `loading` | eager, lazy | 加载策略 |
| `<img>` | `decoding` | sync, async, auto | 解码策略 |
| `<video>` | `src` | URL | 视频源 |
| `<video>` | `controls` | 布尔 | 显示控件 |
| `<video>` | `autoplay` | 布尔 | 自动播放（谨慎使用） |
| `<video>` | `muted` | 布尔 | 静音 |
| `<video>` | `loop` | 布尔 | 循环 |
| `<video>` | `preload` | none, metadata, auto | 预加载策略 |
| `<video>` | `poster` | URL | 封面图 |
| `<audio>` | `src` | URL | 音频源 |
| `<audio>` | `controls` | 布尔 | 显示控件 |
| `<source>` | `src` | URL | 媒体源 |
| `<source>` | `type` | MIME 类型 | 媒体类型 |

### 1.6 跨浏览器一致性保证

#### 1.6.1 基础元素标准化

以下元素在所有现代浏览器中具有一致的解析和渲染行为：

- **流内容元素**：`<div>`, `<p>`, `<span>`, `<h1>`-`<h6>`, `<ul>`, `<ol>`, `<li>`, `<dl>`, `<dt>`, `<dd>`, `<blockquote>`, `<pre>`, `<address>`, `<hr>`, `<br>`
- **文本级语义**：`<a>`, `<em>`, `<strong>`, `<small>`, `<s>`, `<cite>`, `<q>`, `<dfn>`, `<abbr>`, `<ruby>`, `<rt>`, `<rp>`, `<data>`, `<time>`, `<code>`, `<var>`, `<samp>`, `<kbd>`, `<sub>`, `<sup>`, `<i>`, `<b>`, `<u>`, `<mark>`, `<bdi>`, `<bdo>`, `<span>`, `<wbr>`
- **表单元素**：`<form>`, `<input>`, `<textarea>`, `<button>`, `<select>`, `<option>`, `<optgroup>`, `<datalist>`, `<label>`, `<fieldset>`, `<legend>`, `<output>`, `<progress>`, `<meter>`
- **表格元素**：`<table>`, `<caption>`, `<colgroup>`, `<col>`, `<tbody>`, `<thead>`, `<tfoot>`, `<tr>`, `<td>`, `<th>`
- **媒体元素**：`<img>`, `<video>`, `<audio>`, `<source>`, `<track>`, `<canvas>`
- **语义结构**：`<header>`, `<footer>`, `<main>`, `<nav>`, `<article>`, `<section>`, `<aside>`, `<figure>`, `<figcaption>`, `<details>`, `<summary>`, `<dialog>`, `<template>`, `<slot>`

#### 1.6.2 已知差异元素

以下元素在不同浏览器中可能存在渲染差异，AI 生成代码时需注意：

| 元素 | 差异点 | 解决方案 |
|------|-------|---------|
| `<input type="date">` | 日期选择器 UI 样式 | 使用自定义样式或 polyfill |
| `<input type="color">` | 颜色选择器 UI | 使用自定义颜色选择器 |
| `<input type="range">` | 滑块轨道样式 | 使用 CSS 标准化（`-webkit-appearance`） |
| `<progress>` / `<meter>` | 进度条样式 | 使用 CSS 伪元素标准化 |
| `<details>` / `<summary>` | 展开图标样式 | 使用 CSS 自定义箭头 |
| `<dialog>` | 遮罩层样式 | 使用 `::backdrop` 伪元素 |

---

## 2. 表现层：CSS（W3C 标准）

### 2.1 标准来源

- **CSS Snapshot 2025**：[W3C CSS Snapshot 2025](https://www.w3.org/TR/css-2025/)
- **核心模块**：
  - CSS 2.1（基础语法、选择器、盒模型）
  - CSS Selectors Level 4
  - CSS Box Model Level 3
  - CSS Flexbox Level 1
  - CSS Grid Level 1/2
  - CSS Custom Properties（CSS 变量）
  - CSS Transitions / Animations
  - CSS Media Queries Level 4

### 2.2 选择器使用方式和命名约定

#### 2.2.1 选择器优先级（Specificity）

优先级计算公式：`A-B-C`

- **A**：ID 选择器数量
- **B**：类选择器、属性选择器、伪类数量
- **C**：类型选择器、伪元素数量

| 选择器 | 优先级 | 值 |
|--------|-------|-----|
| `*` | 0-0-0 | 0 |
| `div` | 0-0-1 | 1 |
| `.class` | 0-1-0 | 10 |
| `#id` | 1-0-0 | 100 |
| `div.class` | 0-1-1 | 11 |
| `#id.class` | 1-1-0 | 110 |
| `div.class:hover` | 0-2-1 | 21 |
| `style=""` | 内联样式 | 1000 |
| `!important` | 最高优先级 | 覆盖所有 |

#### 2.2.2 AI 编码规则

1. **禁止使用 ID 选择器**（`#id`）用于样式：
   ```css
   /* 禁止 */
   #header { background: blue; }
   
   /* 推荐 */
   .page-header { background: blue; }
   ```

2. **禁止使用 `!important`**：
   ```css
   /* 禁止 */
   .button { color: red !important; }
   
   /* 推荐：通过增加选择器特异性解决 */
   .form .button { color: red; }
   ```

3. **禁止使用元素选择器单独设置样式**（除非重置样式）：
   ```css
   /* 禁止 */
   div { margin: 10px; }
   
   /* 推荐 */
   .container { margin: 10px; }
   ```

4. **类名命名规范**（BEM 方法）：
   ```css
   /* Block */
   .card { }
   
   /* Element */
   .card__title { }
   .card__content { }
   .card__footer { }
   
   /* Modifier */
   .card--large { }
   .card--primary { }
   .card__button--disabled { }
   ```

5. **状态类命名**：
   ```css
   .is-active { }
   .is-hidden { }
   .is-disabled { }
   .has-error { }
   ```

6. **JS 钩子类命名**：
   ```css
   /* JS 操作专用类，不加样式 */
   .js-toggle-menu { }
   .js-validate-form { }
   ```

### 2.3 盒模型、Flex 布局、Grid 布局

#### 2.3.1 盒模型标准化

- **必须使用 `box-sizing: border-box`**：
  ```css
  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }
  ```

- **盒模型组成**（border-box 模式下）：
  ```
  元素总宽度 = width（包含 content + padding + border）
  元素总高度 = height（包含 content + padding + border）
  margin 在元素外部
  ```

#### 2.3.2 Flex 布局标准用法

```css
/* Flex 容器 */
.container {
  display: flex;           /* 或 inline-flex */
  flex-direction: row;       /* row | row-reverse | column | column-reverse */
  flex-wrap: wrap;           /* nowrap | wrap | wrap-reverse */
  justify-content: flex-start;  /* flex-start | flex-end | center | space-between | space-around | space-evenly */
  align-items: stretch;      /* stretch | flex-start | flex-end | center | baseline */
  align-content: stretch;    /* stretch | flex-start | flex-end | center | space-between | space-around | space-evenly */
  gap: 16px;                 /* row-gap column-gap */
}

/* Flex 项目 */
.item {
  flex-grow: 0;              /* 扩展比例 */
  flex-shrink: 1;          /* 收缩比例 */
  flex-basis: auto;        /* 基础尺寸 */
  flex: 0 1 auto;          /* 简写：grow shrink basis */
  align-self: auto;        /* 单独对齐 */
  order: 0;                /* 排序 */
}
```

#### 2.3.3 Grid 布局标准用法

```css
/* Grid 容器 */
.container {
  display: grid;             /* 或 inline-grid */
  grid-template-columns: repeat(3, 1fr);  /* 列定义 */
  grid-template-rows: auto;               /* 行定义 */
  grid-template-areas:
    "header header header"
    "sidebar main main"
    "footer footer footer";
  gap: 16px;                 /* 网格间距 */
  justify-items: stretch;    /* 水平对齐 */
  align-items: stretch;      /* 垂直对齐 */
  justify-content: stretch;  /* 容器内对齐 */
  align-content: stretch;    /* 容器内对齐 */
}

/* Grid 项目 */
.item {
  grid-column: 1 / 3;        /* 跨列 */
  grid-row: 1 / 2;           /* 跨行 */
  grid-area: header;         /* 命名区域 */
  justify-self: stretch;     /* 单独水平对齐 */
  align-self: stretch;       /* 单独垂直对齐 */
}
```

### 2.4 动画、过渡效果实现标准

#### 2.4.1 过渡（Transition）

```css
.element {
  transition-property: all;           /* 或具体属性：background-color, transform */
  transition-duration: 250ms;         /* 必须带单位 */
  transition-timing-function: ease;   /* linear | ease | ease-in | ease-out | ease-in-out | cubic-bezier() */
  transition-delay: 0ms;              /* 延迟时间 */
  transition: all 250ms ease 0ms;     /* 简写 */
}
```

#### 2.4.2 动画（Animation）

```css
/* 定义动画 */
@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* 使用动画 */
.element {
  animation-name: slideIn;
  animation-duration: 300ms;
  animation-timing-function: ease-out;
  animation-delay: 0ms;
  animation-iteration-count: 1;       /* 1 | infinite | 数字 */
  animation-direction: normal;        /* normal | reverse | alternate | alternate-reverse */
  animation-fill-mode: forwards;      /* none | forwards | backwards | both */
  animation-play-state: running;      /* running | paused */
  animation: slideIn 300ms ease-out forwards;  /* 简写 */
}
```

#### 2.4.3 性能优化规则

- **优先使用 `transform` 和 `opacity`** 进行动画，避免触发重排（reflow）：
  ```css
  /* 推荐：GPU 加速 */
  .element {
    transform: translateX(100px);
    opacity: 0.5;
  }
  
  /* 避免：触发重排 */
  .element {
    width: 200px;        /* 重排 */
    height: 200px;       /* 重排 */
    left: 100px;         /* 重排 */
    top: 100px;          /* 重排 */
  }
  ```

- **使用 `will-change` 提示浏览器优化**（动画前添加，动画后移除）：
  ```css
  .element {
    will-change: transform, opacity;
  }
  ```

### 2.5 单位标准化和颜色表示法

#### 2.5.1 长度单位

| 单位 | 用途 | 推荐场景 |
|------|------|---------|
| `px` | 像素 | 边框、阴影、固定尺寸图标 |
| `rem` | 根元素字体大小的倍数 | 字体大小、间距、布局尺寸（**首选**） |
| `em` | 当前元素字体大小的倍数 | 组件内部相对尺寸 |
| `%` | 百分比 | 宽度、高度（相对于父元素） |
| `vw` / `vh` | 视口宽度/高度的百分比 | 全屏布局、响应式字体 |
| `ch` | 字符宽度 | 文本容器宽度 |
| `fr` | 分数单位 | CSS Grid 布局 |

**AI 编码规则**：
- 字体大小必须使用 `rem`
- 间距（margin/padding/gap）优先使用 `rem` 或 CSS 变量
- 布局宽度优先使用 `%` 或 `fr`
- 边框、阴影固定值使用 `px`

#### 2.5.2 颜色表示法

| 格式 | 示例 | 推荐场景 |
|------|------|---------|
| Hex | `#2563eb` | 设计稿直接取值（**首选**） |
| Hex + Alpha | `#2563eb80` | 带透明度的颜色 |
| RGB | `rgb(37, 99, 235)` | 需要动态计算颜色值 |
| RGBA | `rgba(37, 99, 235, 0.5)` | 带透明度的颜色 |
| HSL | `hsl(221, 83%, 53%)` | 需要调整色相/饱和度/亮度 |
| HSLA | `hsl(221, 83%, 53%, 0.5)` | 带透明度的 HSL |
| CSS 变量 | `var(--color-primary)` | 主题系统（**最推荐**） |

**AI 编码规则**：
- 优先使用 CSS 自定义属性（变量）管理颜色
- 设计稿颜色使用 Hex 格式
- 需要透明度时优先使用 Hex + Alpha（`#RRGGBBAA`）或 CSS 变量

### 2.6 跨浏览器渲染一致性

#### 2.6.1 CSS 重置（Reset）

```css
/* WebFast 标准 Reset */
*,
*::before,
*::after {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  line-height: 1.6;
  color: var(--color-text);
  background-color: var(--color-bg);
}

h1, h2, h3, h4, h5, h6, p {
  margin: 0;
}

a {
  color: inherit;
  text-decoration: none;
}

ul, ol {
  margin: 0;
  padding: 0;
  list-style: none;
}

img {
  max-width: 100%;
  display: block;
}

button {
  font-family: inherit;
  cursor: pointer;
  border: none;
  background: none;
}

input, textarea, select {
  font-family: inherit;
  font-size: inherit;
}
```

#### 2.6.2 表单元素标准化

```css
/* 统一表单元素外观 */
input, textarea, select, button {
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
}

/* 恢复特定元素的默认外观 */
input[type="checkbox"] {
  -webkit-appearance: checkbox;
  -moz-appearance: checkbox;
  appearance: checkbox;
}

input[type="radio"] {
  -webkit-appearance: radio;
  -moz-appearance: radio;
  appearance: radio;
}
```

---

## 3. 行为层：JavaScript（ECMAScript 2025）+ Web API（W3C/WHATWG）

### 3.1 ECMAScript 2025 标准

- **规范来源**：[ECMAScript 2025 Language Specification](https://tc39.es/ecma262/2025/)
- **发布状态**：2025 年 6 月，Ecma International 正式发布
- **制定组织**：TC39（Ecma International 技术委员会 39）

#### 3.1.1 语言核心特性规范

**变量声明**：
```javascript
// 优先使用 const
const PI = 3.14159;
const user = { name: 'Alice' };

// 需要重新赋值时使用 let
let count = 0;
count++;

// 禁止使用 var
// var name = 'Bob';  // 错误
```

**箭头函数**：
```javascript
// 简单表达式
const double = x => x * 2;

// 多参数
const sum = (a, b) => a + b;

// 多行语句
const fetchUser = async (id) => {
  const response = await fetch(`/api/users/${id}`);
  return response.json();
};

// 返回对象字面量（需要括号）
const createUser = name => ({ name, active: true });
```

**模板字符串**：
```javascript
const name = 'Alice';
const age = 30;

// 基本插值
const greeting = `Hello, ${name}!`;

// 表达式插值
const info = `${name} is ${age} years old.`;

// 多行文本
const html = `
  <div class="user">
    <h1>${name}</h1>
    <p>Age: ${age}</p>
  </div>
`;

// 标签模板（用于 HTML 转义）
const safeHtml = htmlEscape`
  <div>${userInput}</div>
`;
```

**解构赋值**：
```javascript
// 对象解构
const { name, age, email = 'unknown' } = user;

// 重命名
const { name: userName, age: userAge } = user;

// 嵌套解构
const { address: { city, zip } } = user;

// 数组解构
const [first, second, ...rest] = items;

// 函数参数解构
function createUser({ name, email, role = 'user' }) {
  return { name, email, role };
}
```

**展开运算符**：
```javascript
// 数组展开
const combined = [...array1, ...array2];

// 对象展开
const updated = { ...user, age: 31 };

// 函数参数
const max = Math.max(...numbers);

// 浅拷贝
const copy = { ...original };
const arrayCopy = [...originalArray];
```

**类定义（Class）**：
```javascript
// 基础类
class User {
  constructor(name, email) {
    this.name = name;
    this.email = email;
  }

  greet() {
    return `Hello, ${this.name}!`;
  }

  // 静态方法
  static createGuest() {
    return new User('Guest', '');
  }
}

// 继承
class Admin extends User {
  constructor(name, email, permissions) {
    super(name, email);
    this.permissions = permissions;
  }

  hasPermission(permission) {
    return this.permissions.includes(permission);
  }
}

// 私有字段（ES2022+）
class BankAccount {
  #balance = 0;  // 私有字段

  deposit(amount) {
    this.#balance += amount;
  }

  getBalance() {
    return this.#balance;
  }
}
```

**模块化（ES Modules）**：
```javascript
// 命名导出
export const PI = 3.14159;
export function add(a, b) {
  return a + b;
}

// 默认导出
export default class Component {
  // ...
}

// 混合导出
export { PI, add };
export default Component;

// 导入
import { PI, add } from './math.js';
import Component from './component.js';
import * as MathUtils from './math.js';
import { PI as MATH_PI } from './math.js';

// 动态导入
const module = await import('./lazy-module.js');
```

**异步编程**：
```javascript
// Promise
const fetchData = () => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve({ data: [] });
    }, 1000);
  });
};

// async/await
async function loadUserData(userId) {
  try {
    const response = await fetch(`/api/users/${userId}`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const user = await response.json();
    return user;
  } catch (error) {
    console.error('Failed to load user:', error);
    throw error;
  }
}

// Promise.all
const [users, posts] = await Promise.all([
  fetchUsers(),
  fetchPosts()
]);

// Promise.race
const timeout = new Promise((_, reject) => {
  setTimeout(() => reject(new Error('Timeout')), 5000);
});
const result = await Promise.race([fetchData(), timeout]);
```

**可选链操作符（Optional Chaining）**：
```javascript
const userCity = user?.address?.city;
const firstItem = array?.[0];
const result = object?.method?.();
```

**空值合并运算符（Nullish Coalescing）**：
```javascript
const value = input ?? 'default';  // 仅在 null/undefined 时使用默认值
const count = data.count ?? 0;     // 0 是有效值，不会被替换
```

#### 3.1.2 禁止使用的语法

| 语法 | 原因 | 替代方案 |
|------|------|---------|
| `var` | 函数作用域，变量提升 | `const` / `let` |
| `==` / `!=` | 隐式类型转换 | `===` / `!==` |
| `with` | 性能差，可读性差 | 直接访问对象属性 |
| `eval()` | 安全风险，性能差 | JSON.parse() / 函数构造 |
| `new Function()` | 安全风险 | 箭头函数 / 普通函数 |
| `arguments` | 类数组，不易用 | 剩余参数 `...args` |
| `for...in`（数组） | 遍历可枚举属性 | `for...of` / `forEach` |
| `__proto__` | 已弃用 | `Object.getPrototypeOf()` |

### 3.2 Web API 标准

#### 3.2.1 DOM 操作（W3C DOM Standard / WHATWG DOM Living Standard）

**元素查询**：
```javascript
// 单个元素
const element = document.querySelector('.class-name');
const elementById = document.getElementById('id-name');  // 仅用于已知 ID

// 多个元素
const elements = document.querySelectorAll('.item');
const elementsByClass = document.getElementsByClassName('item');  // 实时集合，慎用

// 在元素内查询
const child = element.querySelector('.child');
```

**元素创建与修改**：
```javascript
// 创建元素
const div = document.createElement('div');
div.className = 'container';
div.id = 'main-container';

// 设置属性
div.setAttribute('data-id', '123');
div.setAttribute('aria-label', 'Main content');

// 设置内容（安全方式）
div.textContent = 'Safe text';  // 自动转义 HTML

// 设置 HTML（危险，需确保内容可信）
div.innerHTML = '<span>HTML content</span>';

// 插入元素
parent.appendChild(div);           // 末尾添加
parent.prepend(div);               // 开头添加
parent.insertBefore(div, reference); // 参考元素前插入

// 移除元素
div.remove();                      // 现代浏览器
parent.removeChild(div);           // 兼容方式

// 替换元素
parent.replaceChild(newElement, oldElement);
```

**类名操作**：
```javascript
// 现代 API（推荐）
element.classList.add('active');
element.classList.remove('inactive');
element.classList.toggle('visible');
element.classList.contains('active');
element.classList.replace('old-class', 'new-class');

// 禁止直接操作 className 字符串
element.className += ' active';  // 错误：可能产生重复类名
```

**样式操作**：
```javascript
// 设置内联样式（仅用于动态计算值）
element.style.width = '100px';
element.style.transform = 'translateX(10px)';

// 获取计算样式
const styles = window.getComputedStyle(element);
const width = styles.width;

// 禁止直接设置 style.cssText
element.style.cssText = 'width: 100px; height: 200px;';  // 不推荐
```

**事件处理**：
```javascript
// 添加事件监听
element.addEventListener('click', handleClick);

// 带选项的事件监听
element.addEventListener('scroll', handleScroll, { passive: true });
element.addEventListener('click', handleClick, { once: true });

// 移除事件监听
element.removeEventListener('click', handleClick);

// 事件委托
document.addEventListener('click', (event) => {
  if (event.target.matches('.button')) {
    handleButtonClick(event);
  }
});

// 自定义事件
element.dispatchEvent(new CustomEvent('user-action', {
  detail: { action: 'save', data: userData },
  bubbles: true,
  composed: true  // 可穿越 Shadow DOM
}));
```

#### 3.2.2 BOM 访问（Window 对象）

```javascript
// 窗口尺寸
const viewportWidth = window.innerWidth;
const viewportHeight = window.innerHeight;

// 滚动位置
const scrollX = window.scrollX;
const scrollY = window.scrollY;

// 滚动到指定位置
window.scrollTo({ top: 0, behavior: 'smooth' });

// 本地存储
localStorage.setItem('key', 'value');
const value = localStorage.getItem('key');
localStorage.removeItem('key');

// 会话存储
sessionStorage.setItem('temp', 'data');

// URL 操作
const url = new URL(window.location.href);
const params = new URLSearchParams(url.search);
params.set('page', '2');
window.history.pushState({}, '', url);

// 定时器
const timeoutId = setTimeout(() => { }, 1000);
clearTimeout(timeoutId);

const intervalId = setInterval(() => { }, 1000);
clearInterval(intervalId);

// 动画帧
const animationId = requestAnimationFrame(() => { });
cancelAnimationFrame(animationId);
```

#### 3.2.3 Fetch API（WHATWG Fetch Living Standard）

```javascript
// GET 请求
const response = await fetch('/api/users');
const users = await response.json();

// POST 请求
const response = await fetch('/api/users', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ name: 'Alice' }),
});

// 处理响应
if (!response.ok) {
  throw new Error(`HTTP ${response.status}: ${response.statusText}`);
}

// 根据 Content-Type 解析
const contentType = response.headers.get('Content-Type');
if (contentType.includes('application/json')) {
  return await response.json();
}
if (contentType.includes('text/')) {
  return await response.text();
}

// 中止请求
const controller = new AbortController();
const signal = controller.signal;

fetch('/api/data', { signal })
  .then(response => response.json())
  .catch(err => {
    if (err.name === 'AbortError') {
      console.log('Request aborted');
    }
  });

// 5 秒后中止
setTimeout(() => controller.abort(), 5000);
```

#### 3.2.4 Canvas API（W3C HTML Canvas 2D Context）

```javascript
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

// 设置画布尺寸（考虑设备像素比）
const dpr = window.devicePixelRatio || 1;
canvas.width = canvas.clientWidth * dpr;
canvas.height = canvas.clientHeight * dpr;
ctx.scale(dpr, dpr);

// 绘制矩形
ctx.fillStyle = '#2563eb';
ctx.fillRect(10, 10, 100, 50);

// 绘制文本
ctx.font = '16px sans-serif';
ctx.fillStyle = '#1f2937';
ctx.fillText('Hello', 10, 30);

// 绘制路径
ctx.beginPath();
ctx.moveTo(10, 10);
ctx.lineTo(100, 50);
ctx.strokeStyle = '#ef4444';
ctx.stroke();
```

#### 3.2.5 WebGL API（Khronos Group / W3C）

```javascript
const canvas = document.getElementById('glCanvas');
const gl = canvas.getContext('webgl2');

if (!gl) {
  console.error('WebGL 2 not supported');
  // 降级到 WebGL 1
}

// 设置清除颜色
 gl.clearColor(0.0, 0.0, 0.0, 1.0);
gl.clear(gl.COLOR_BUFFER_BIT);
```

#### 3.2.6 WebAssembly API（W3C WebAssembly）

```javascript
// 加载 WASM 模块
const response = await fetch('module.wasm');
const bytes = await response.arrayBuffer();
const module = await WebAssembly.compile(bytes);
const instance = await WebAssembly.instantiate(module, {
  env: {
    memory: new WebAssembly.Memory({ initial: 256 }),
  }
});

// 调用导出函数
const result = instance.exports.add(1, 2);
```

### 3.3 Web Components API（W3C / WHATWG）

```javascript
// 自定义元素
class MyElement extends HTMLElement {
  static get observedAttributes() {
    return ['color', 'size'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
  }

  disconnectedCallback() {
    // 清理
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue) {
      this.render();
    }
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; }
      </style>
      <div class="content">${this.getAttribute('color')}</div>
    `;
  }
}

customElements.define('my-element', MyElement);

// HTML 模板
template.innerHTML = `
  <style>.title { color: var(--color-primary); }</style>
  <h1 class="title"><slot name="title"></slot></h1>
  <div class="body"><slot></slot></div>
`;
```

---

## 4. 附加强制约束

### 4.1 无障碍标准：WCAG 2.2

- **规范来源**：[WCAG 2.2](https://www.w3.org/TR/WCAG22/)（W3C Recommendation，2024 年 12 月 12 日）
- **合规等级**：AA 级（政府和大企业网站的最低要求）
- **制定组织**：W3C Web Accessibility Initiative（WAI）

#### 4.1.1 四大原则（POUR）

| 原则 | 含义 | 关键要求 |
|------|------|---------|
| **Perceivable**（可感知） | 信息必须可被用户感知 | 提供文本替代、字幕、颜色对比度 |
| **Operable**（可操作） | 界面组件必须可操作 | 键盘可访问、足够时间、无闪烁 |
| **Understandable**（可理解） | 信息和操作必须可理解 | 可读文本、可预测行为、输入辅助 |
| **Robust**（健壮） | 内容必须可被辅助技术解析 | 有效的 HTML、兼容辅助技术 |

#### 4.1.2 AI 编码规则

**1. 图像必须有替代文本**：
```html
<!-- 正确 -->
<img src="chart.jpg" alt="2025年Q1销售额增长趋势图，显示增长23%" />

<!-- 装饰性图像 -->
<img src="divider.jpg" alt="" />  <!-- alt为空表示装饰性 -->

<!-- 错误 -->
<img src="chart.jpg" />  <!-- 缺少 alt -->
```

**2. 表单元素必须有标签**：
```html
<!-- 正确：显式关联 -->
<label for="email">邮箱地址</label>
<input type="email" id="email" name="email" required />

<!-- 正确：隐式关联 -->
<label>
  邮箱地址
  <input type="email" name="email" required />
</label>

<!-- 正确：aria-label -->
<input type="search" aria-label="搜索内容" />

<!-- 错误 -->
<input type="email" placeholder="请输入邮箱" />  <!-- 无标签 -->
```

**3. 颜色对比度必须达标**：
```css
/* AA 级要求：
   - 正常文本：4.5:1
   - 大文本（18px+ 或 14px+ bold）：3:1
   - UI 组件和图形：3:1
*/

/* 正确：高对比度 */
.text-primary {
  color: #1f2937;  /* 深灰 */
  background: #ffffff;  /* 白 */
  /* 对比度：12.6:1 */
}

/* 错误：低对比度 */
.text-muted {
  color: #9ca3af;  /* 浅灰 */
  background: #f3f4f6;  /* 浅灰背景 */
  /* 对比度：1.9:1，不满足 AA */
}
```

**4. 键盘可访问**：
```html
<!-- 正确：使用原生可聚焦元素 -->
<button onclick="submit()">提交</button>
<a href="/page">链接</a>

<!-- 错误：div 模拟按钮 -->
<div onclick="submit()">提交</div>  <!-- 无法键盘聚焦 -->

<!-- 正确：div 模拟按钮（添加无障碍属性） -->
<div role="button" tabindex="0" onclick="submit()" onkeydown="if(event.key==='Enter'||event.key===' ')submit()">
  提交
</div>
```

**5. 页面必须有标题和语言**：
```html
<!DOCTYPE html>
<html lang="zh-CN">  <!-- 必须指定语言 -->
<head>
  <title>页面标题 - 网站名称</title>  <!-- 必须唯一且有描述性 -->
</head>
```

**6. 焦点可见**：
```css
/* 正确：清晰的焦点样式 */
:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

/* 错误：移除焦点样式 */
:focus {
  outline: none;  /* 禁止！ */
}
```

**7. 跳过链接（Skip Link）**：
```html
<body>
  <a href="#main-content" class="skip-link">跳转到主要内容</a>
  <nav>...</nav>
  <main id="main-content">
    <!-- 主要内容 -->
  </main>
</body>
```

**8. ARIA 属性使用规范**：
```html
<!-- 正确：补充语义 -->
<nav aria-label="主导航">
  <ul>...</ul>
</nav>

<!-- 正确：动态内容 -->
<div role="alert" aria-live="polite">
  表单提交成功
</div>

<!-- 错误：冗余 ARIA -->
<button role="button">提交</button>  <!-- button 已有默认 role -->

<!-- 错误：错误的 ARIA -->
<div role="heading" aria-level="1">标题</div>  <!-- 应使用 h1 -->
```

### 4.2 安全标准

#### 4.2.1 Content Security Policy（CSP）

- **规范来源**：[CSP Level 3](https://www.w3.org/TR/CSP3/)（W3C Working Draft，2025 年 2 月）
- **标准状态**：CSP Level 2 已作为 W3C Recommendation 发布（2016 年）。CSP Level 3 目前为 Working Draft，但大部分指令已被主流浏览器实现。
- **制定组织**：W3C Web Application Security Working Group

**AI 编码规则**：

```html
<!-- 在 <meta> 标签中设置 CSP（仅用于无法设置 HTTP 头的场景） -->
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  font-src 'self';
  connect-src 'self';
  media-src 'self';
  object-src 'none';
  frame-src 'none';
  base-uri 'self';
  form-action 'self';
  upgrade-insecure-requests;
">

<!-- 推荐方式：通过 HTTP 响应头设置 -->
<!-- Content-Security-Policy: default-src 'self'; script-src 'self'; ... -->
```

**CSP 指令速查表**：

| 指令 | 用途 | 推荐值 |
|------|------|-------|
| `default-src` | 默认资源策略 | `'self'` |
| `script-src` | JavaScript 来源 | `'self'`（禁止内联脚本） |
| `style-src` | CSS 来源 | `'self' 'unsafe-inline'`（允许内联样式） |
| `img-src` | 图像来源 | `'self' data: https:` |
| `font-src` | 字体来源 | `'self'` |
| `connect-src` | XHR/WebSocket 来源 | `'self'` |
| `media-src` | 媒体来源 | `'self'` |
| `object-src` | 插件来源 | `'none'`（禁用 Flash 等） |
| `frame-src` | 框架来源 | `'none'` 或 `'self'` |
| `base-uri` | `<base>` 标签限制 | `'self'` |
| `form-action` | 表单提交目标 | `'self'` |
| `upgrade-insecure-requests` | 自动升级 HTTP 到 HTTPS | 存在即启用 |

#### 4.2.2 XSS 防护

**1. 输入转义**：
```javascript
// 转义 HTML 特殊字符
function escapeHtml(str) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  };
  return str.replace(/[&<>"']/g, c => map[c]);
}

// 使用 textContent 代替 innerHTML
element.textContent = userInput;  // 安全
// element.innerHTML = userInput;  // 危险！
```

**2. URL 验证**：
```javascript
// 验证 URL 协议
function isSafeUrl(url) {
  try {
    const parsed = new URL(url, window.location.href);
    return ['http:', 'https:', 'mailto:', 'tel:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

// 禁止 javascript: 协议
// <a href="javascript:alert('XSS')">点击</a>  // 危险！
```

**3. 安全的 DOM 操作**：
```javascript
// 使用 createElement 代替 innerHTML
const div = document.createElement('div');
div.textContent = userInput;  // 安全
parent.appendChild(div);

// 使用 DOMPurify 清理 HTML（如需支持 HTML 输入）
// const clean = DOMPurify.sanitize(dirtyHtml);
```

#### 4.2.3 HTTPS 强制

```html
<!-- 通过 CSP 升级非安全请求 -->
<meta http-equiv="Content-Security-Policy" content="upgrade-insecure-requests">

<!-- 通过 HSTS 头（服务器端设置） -->
<!-- Strict-Transport-Security: max-age=31536000; includeSubDomains; preload -->
```

**AI 编码规则**：
- 所有外部资源（图片、脚本、样式）必须使用 HTTPS
- 禁止混合内容（Mixed Content）：HTTPS 页面加载 HTTP 资源
- 内部链接使用相对路径或 `//` 协议相对 URL

#### 4.2.4 其他安全措施

**1. 点击劫持防护**：
```html
<!-- 禁止页面被嵌入 iframe -->
<meta http-equiv="X-Frame-Options" content="DENY">
<!-- 或 -->
<meta http-equiv="X-Frame-Options" content="SAMEORIGIN">
```

**2. MIME 类型嗅探防护**：
```html
<meta http-equiv="X-Content-Type-Options" content="nosniff">
```

**3. Referrer 策略**：
```html
<meta name="referrer" content="strict-origin-when-cross-origin">
```

**4. 权限策略（Permissions Policy）**：
```html
<meta http-equiv="Permissions-Policy" content="
  camera=(),
  microphone=(),
  geolocation=(self),
  payment=()
">
```

---

## 5. AI 代码生成检查清单

AI 生成代码后，必须按照以下清单进行自检：

### 5.1 HTML 检查

- [ ] 所有标签使用小写
- [ ] 所有属性值使用双引号包裹
- [ ] 自闭合标签使用 `/`（如 `<img />`）
- [ ] 所有 `<img>` 有 `alt` 属性
- [ ] 所有表单元素有 `<label>` 或 `aria-label`
- [ ] 标题层级按顺序使用（h1 → h2 → h3）
- [ ] 每页只有一个 `<main>` 元素
- [ ] 页面有 `<html lang="">` 和 `<title>`
- [ ] 没有使用废弃标签（`<font>`, `<center>`, `<marquee>` 等）

### 5.2 CSS 检查

- [ ] 使用 `box-sizing: border-box`
- [ ] 没有使用 `!important`
- [ ] 没有使用 ID 选择器（`#id`）设置样式
- [ ] 类名使用 BEM 命名法
- [ ] 颜色对比度满足 WCAG AA（4.5:1）
- [ ] 字体大小使用 `rem`
- [ ] 优先使用 CSS 变量管理颜色和间距
- [ ] 动画使用 `transform` 和 `opacity`（GPU 加速）

### 5.3 JavaScript 检查

- [ ] 使用 `const` / `let`，没有 `var`
- [ ] 使用 `===` / `!==`，没有 `==` / `!=`
- [ ] 使用模板字符串代替字符串拼接
- [ ] 异步代码使用 `async/await`
- [ ] 使用 ES Modules（`import` / `export`）
- [ ] 没有使用 `eval()` 或 `new Function()`
- [ ] DOM 操作使用 `textContent` 代替 `innerHTML`（用户输入场景）
- [ ] 事件监听使用 `addEventListener`，没有内联事件（`onclick`）

### 5.4 无障碍检查

- [ ] 所有交互元素可键盘访问（Tab 键聚焦）
- [ ] 焦点样式可见（`:focus-visible`）
- [ ] 有"跳过导航"链接
- [ ] ARIA 属性使用正确（不冗余、不错误）
- [ ] 动态内容更新有 `aria-live` 通知
- [ ] 颜色不单独传达信息（有图标/文字辅助）

### 5.5 安全检查

- [ ] CSP 头已设置
- [ ] 没有内联脚本（`onclick`, `javascript:`）
- [ ] 用户输入已转义（`escapeHtml`）
- [ ] 外部资源使用 HTTPS
- [ ] `X-Frame-Options` 已设置
- [ ] `X-Content-Type-Options: nosniff` 已设置

---

## 6. 标准更新与维护

### 6.1 版本跟踪

| 版本 | 日期 | 更新内容 |
|------|------|---------|
| 1.0 | 2026-06-14 | 初始版本，涵盖 HTML/CSS/JS/Web API/Accessibility/Security |

### 6.2 标准来源跟踪

AI 应定期检查以下规范的最新版本：

- HTML：https://html.spec.whatwg.org/
- CSS：https://www.w3.org/TR/css-2025/
- ECMAScript：https://tc39.es/ecma262/
- WCAG：https://www.w3.org/TR/WCAG22/
- CSP：https://www.w3.org/TR/CSP3/
- Fetch：https://fetch.spec.whatwg.org/
- DOM：https://dom.spec.whatwg.org/

### 6.3 浏览器兼容性

AI 生成代码时，应确保代码在以下浏览器版本中正常工作：

- Chrome（最新 2 个版本）
- Firefox（最新 2 个版本）
- Safari（最新 2 个版本）
- Edge（最新 2 个版本）

使用 [Can I use](https://caniuse.com/) 查询特定功能的浏览器支持情况。
