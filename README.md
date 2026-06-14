# WebFast

面向 AI 的原生前端框架 — 零构建、零语法糖、纯原生 Web。

浏览器原生 ES Modules，写什么就跑什么，无需 Webpack/Vite。AI 写的代码 = 人类写的代码 = 浏览器运行的代码。

## 特性

- **零构建** — 浏览器原生 ES Modules，无需打包工具
- **零语法糖** — 原生 JavaScript + HTML + CSS，AI 直接生成可运行代码
- **约定式结构** — 严格的目录和文件命名规范，AI 只需按模板填充
- **组件化** — 基于 Web Components，支持 Shadow DOM / Light DOM 切换
- **水合模式** — 静态 HTML 直接渲染，JS 只负责绑定事件和交互
- **Diff 算法** — 基于真实 DOM 的细粒度更新，保留焦点、滚动、表单值
- **灵活渲染** — 组件、页面、路由均可选择最适合自己的渲染方式

## 快速开始

```bash
# 克隆项目
git clone https://github.com/songdiyang/WebFast.git
cd WebFast

# 启动开发服务器
npx serve . -p 5200

# 打开浏览器访问 http://localhost:5200
```

## 项目结构

```
WebFast/
├── app.js                 # 应用入口：注册组件、配置路由、启动应用
├── config.js              # 全局配置：API 地址、路由模式、容器选择器等
├── index.html             # 首页：包含静态内容，JS 水合绑定事件
├── server.js              # 开发服务器（可选）
│
├── core/                  # 框架核心（通常无需修改）
│   ├── component.js       # Web Components 基类
│   ├── page.js            # 页面基类
│   ├── router.js          # 约定式路由系统
│   ├── diff.js            # DOM Diff 算法
│   ├── store.js           # 状态管理
│   ├── http.js            # HTTP 请求封装
│   ├── event-bus.js       # 组件通信
│   └── utils.js           # 工具函数
│
├── components/            # 全局组件
│   ├── app-header/        # 页头组件
│   │   ├── index.js       # 组件逻辑
│   │   ├── template.html  # 组件模板
│   │   └── style.css      # 组件样式
│   └── app-footer/        # 页脚组件
│
├── pages/                 # 页面（按路由划分）
│   └── home/              # 首页
│       ├── index.js       # 页面逻辑
│       ├── template.html  # 页面模板
│       └── style.css      # 页面样式
│
└── styles/                # 全局样式
    ├── reset.css          # 样式重置
    ├── variables.css      # CSS 变量
    └── global.css         # 全局样式
```

## 核心概念

### 1. 组件（Component）

组件是框架的基础单元，基于 Web Components 标准。

**创建组件：**

```javascript
// components/my-button/index.js
import { WebFastComponent } from '../../core/component.js';

export default class MyButton extends WebFastComponent {
  constructor() {
    super({
      template: './template.html',
      style: './style.css',
      shadow: false,  // false = Light DOM, true = Shadow DOM
    });
    this.setBaseUrl(import.meta.url);
  }

  events() {
    return {
      'click .btn': this.onClick,
    };
  }

  onClick(e) {
    this.emit('clicked', { id: this.id });
  }
}
```

```html
<!-- components/my-button/template.html -->
<button class="btn">{{label}}</button>
```

```css
/* components/my-button/style.css */
.btn {
  padding: 8px 16px;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: 4px;
}
```

**注册组件：**

```javascript
// app.js
import { defineComponent } from './core/component.js';
import MyButton from './components/my-button/index.js';

defineComponent(MyButton, 'my-button');
```

**使用组件：**

```html
<my-button></my-button>
```

### 2. 页面（Page）

页面与组件 API 相同，但直接操作真实 DOM（无 Shadow DOM），适合作为路由目标。

**创建页面：**

```javascript
// pages/home/index.js
import { WebFastPage } from '../../core/page.js';

export default class HomePage extends WebFastPage {
  constructor() {
    super({
      template: './template.html',
      style: './style.css',
    });
    this.setBaseUrl(import.meta.url);
  }

  onConnected() {
    // 页面挂载后调用
    console.log('Home page connected');
  }
}
```

### 3. 路由（Router）

约定式路由，路径对应页面目录结构。

```javascript
// app.js
import { Router } from './core/router.js';

const router = new Router({
  container: '#app',
  mode: 'history',
  routes: [
    { path: '/', page: () => import('./pages/home/index.js') },
    { path: '/about', page: () => import('./pages/about/index.js') },
    { path: '/user/:id', page: () => import('./pages/user/[id].js') },
  ],
});

router.start();
```

### 4. 渲染模式选择

框架支持多种渲染模式，用户可根据项目需求选择：

#### 模式 A：组件 + 水合（推荐）

HTML 中保留静态内容，JS 只绑定事件。首屏快，SEO 友好。

```html
<!-- index.html -->
<app-header>
  <div class="header-inner">...</div>
</app-header>
```

```javascript
// components/app-header/index.js
async connectedCallback() {
  if (this.children.length > 0) {
    // 水合模式：已有内容，只绑定事件
    this._initialized = true;
    this._bindEvents();
  } else {
    // 标准模式：加载模板渲染
    await this._init();
  }
}
```

#### 模式 B：纯组件

完全由 JS 渲染，适合高度动态的内容。

```html
<app-header></app-header>
```

#### 模式 C：Shadow DOM

样式完全隔离，适合独立 UI 组件库。

```javascript
constructor() {
  super({ template: './template.html', style: './style.css', shadow: true });
}
```

#### 模式 D：Light DOM

样式与页面共享，适合需要继承全局样式的组件。

```javascript
constructor() {
  super({ template: './template.html', style: './style.css', shadow: false });
}
```

### 5. Diff 算法

页面内的局部更新使用 Diff 算法，只修改变化的 DOM 节点，保留用户状态。

```javascript
// 页面内更新数据，自动触发 Diff
this.render({ count: 42 });
```

Diff 算法会自动：
- 对比新旧 DOM 树
- 只更新变化的节点
- 保留焦点位置
- 保留滚动位置
- 保留表单值

## 配置

```javascript
// config.js
export const config = {
  appContainer: '#app',
  routerMode: 'history',
  apiBaseUrl: 'https://api.example.com',
  debug: true,
};
```

## 部署

### 静态服务器

```bash
npx serve . -p 5200
```

### Vercel

```bash
vercel --prod
```

### 任何支持静态托管的平台

直接上传项目文件即可，无需构建步骤。

## 自定义项目

1. **删除示例页面**：删除 `pages/about/`、`pages/counter/`、`pages/user/` 目录
2. **修改首页内容**：编辑 `pages/home/template.html` 和 `index.html`
3. **添加新页面**：在 `pages/` 下创建新目录，参考 `pages/home/` 结构
4. **添加新组件**：在 `components/` 下创建新目录，参考 `components/app-header/` 结构
5. **修改路由**：编辑 `app.js` 中的 `routes` 数组
6. **修改样式**：编辑 `styles/variables.css` 中的 CSS 变量

## 设计原则

- **标准优先** — 遵循 WHATWG、W3C、ECMAScript 标准
- **无障碍合规** — 符合 WCAG 2.2 规范
- **安全默认** — 内置 CSP、XSS 防护建议
- **AI 友好** — 零抽象层，AI 生成的代码可直接运行

## 文档

- [开发规范](docs/standards.md)
- [检查清单](docs/checklist.md)
- [示例代码](docs/examples/)

## 许可证

MIT
