// TypeScript declarations for WebFast framework
// This file provides global type definitions for IDEs and TypeScript tooling

declare module '*/core/component.js' {
  export interface WebFastComponentOptions {
    template?: string;
    style?: string;
    shadow?: boolean;
  }

  export interface EventMap {
    [key: string]: (e: Event) => void;
  }

  export class WebFastComponent extends HTMLElement {
    constructor(options?: WebFastComponentOptions);
    $http: import('*/core/http.js').HttpClient;
    /** @private */
    _templateUrl?: string;
    /** @private */
    _styleUrl?: string;
    _shadow: boolean;
    _shadowRoot: HTMLElement | ShadowRoot;
    _initialized: boolean;
    _pendingData: Record<string, any> | null;
    _eventListeners: Array<{ el: Element; eventType: string; boundHandler: EventListener }>;
    _storeUnsubscribers: Array<(() => void) | undefined>;
    _eventBusListeners: Array<{ eventName: string; handler: (data: any) => void }>;
    _isConnected: boolean;
    _baseUrl?: string;

    static observedAttributes?: string[];

    connectedCallback(): Promise<void>;
    disconnectedCallback(): void;
    attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void;

    setBaseUrl(importMetaUrl: string): void;
    render(data?: Record<string, any>): void;
    $(selector: string): Element | null;
    $$(selector: string): NodeListOf<Element>;
    emit(eventName: string, detail?: any): void;
    listen(eventName: string, handler: (data: any) => void): void;
    unlisten(eventName: string, handler: (data: any) => void): void;

    events?(): EventMap;
    onConnected?(): void;
    onDisconnected?(): void;
    onAttributeChanged?(name: string, oldVal: string | null, newVal: string | null): void;
    subscribe?(): string[];
    onStoreChanged?(storeName: string, state: any, oldState: any): void;
  }

  export function defineComponent(
    ComponentClass: typeof WebFastComponent,
    tagName?: string
  ): string;
}

declare module '*/core/page.js' {
  export interface WebFastPageOptions {
    template?: string;
    style?: string;
  }

  export interface MountOptions {
    hydrate?: boolean;
    hydrateEl?: Element;
  }

  export interface EventMap {
    [key: string]: (e: Event) => void;
  }

  export class WebFastPage {
    constructor(options?: WebFastPageOptions);
    $http: import('*/core/http.js').HttpClient;
    el: HTMLDivElement;
    /** @private */
    _templateUrl?: string;
    /** @private */
    _styleUrl?: string;
    _eventListeners: Array<{ el: Element; eventType: string; boundHandler: EventListener }>;
    _storeUnsubscribers: Array<(() => void) | undefined>;
    _eventBusListeners: Array<{ eventName: string; handler: (data: any) => void }>;
    _initialized: boolean;
    _pendingData: Record<string, any> | null;
    _baseUrl?: string;

    mount(options?: MountOptions): Promise<void>;
    unmount(): void;
    setBaseUrl(importMetaUrl: string): void;
    render(data?: Record<string, any>): void;
    $(selector: string): Element | null;
    $$(selector: string): NodeListOf<Element>;
    emit(eventName: string, detail?: any): void;
    listen(eventName: string, handler: (data: any) => void): void;
    unlisten(eventName: string, handler: (data: any) => void): void;

    events?(): EventMap;
    onConnected?(): void;
    onDisconnected?(): void;
    subscribe?(): string[];
    onStoreChanged?(storeName: string, state: any, oldState: any): void;
    onRouteEnter?(params: Record<string, string>, query: Record<string, string>): void | Promise<void>;
  }
}

declare module '*/core/router.js' {
  export interface RouteDefinition {
    path: string;
    page: () => Promise<any>;
    children?: RouteDefinition[];
    meta?: Record<string, any>;
    beforeEnter?: (ctx: RouteContext) => boolean | string | Promise<boolean | string>;
    beforeLeave?: (page: any, ctx: RouteContext) => boolean | string | Promise<boolean | string>;
  }

  export interface RouteContext {
    path: string;
    query: Record<string, string>;
    params: Record<string, string>;
    meta?: Record<string, any>;
  }

  export interface RouterOptions {
    container: string;
    routes: RouteDefinition[];
    mode?: 'history' | 'hash';
    on404?: (ctx: { path: string; query: Record<string, string> }) => void;
    scrollBehavior?: (to: RouteContext, from: RouteContext | null) => void;
  }

  export interface StartOptions {
    hydrate?: boolean;
  }

  export class Router {
    constructor(options: RouterOptions);
    start(options?: StartOptions): void;
    destroy(): void;
    navigate(path: string, replace?: boolean): void;
    beforeEach(fn: (to: RouteContext, from: RouteContext | null) => boolean | string | Promise<boolean | string>): void;
    afterEach(fn: (to: RouteContext, from: RouteContext | null) => void): void;
  }
}

declare module '*/core/diff.js' {
  export interface PatchOp {
    type: string;
    [key: string]: any;
  }

  export interface ChildPatchOp {
    type: 'createChild' | 'removeChild' | 'moveChild' | 'updateChild';
    index?: number;
    node?: Node;
    to?: number;
    oldNode?: Node;
    ops?: PatchOp[];
  }

  export function diff(oldTree: Node, newTree: Node): PatchOp[];
  export function patch(rootNode: Node, patches: PatchOp[]): void;
  export function diffChildren(oldChildren: Node[], newChildren: Node[]): ChildPatchOp[];
  export function patchChildren(parent: Element, patches: ChildPatchOp[]): void;
  export function applyChildPatch(parent: Element, op: ChildPatchOp): void;
  export function preserveState(fn: () => void): void;
}

declare module '*/core/store.js' {
  export interface StoreModuleOptions {
    state?: Record<string, any>;
    actions?: Record<string, (state: any, payload: any) => any | Promise<any>>;
    getters?: Record<string, (state: any) => any>;
  }

  export interface StoreOptions extends StoreModuleOptions {
    modules?: Record<string, StoreModuleOptions>;
  }

  export interface Store {
    getState(): any;
    dispatch(actionName: string, payload?: any): void | Promise<void>;
    setState(partialState: Record<string, any>): void;
    get(key: string): any;
    subscribe(fn: (state: any, oldState: any) => void): () => void;
    module(name: string): Store | undefined;
    use(plugin: (store: Store) => void): void;
  }

  export function createStore(name: string, options: StoreOptions): Store;
  export function getStore(name: string): Store | undefined;
  export function removeStore(name: string): void;
  export function clearStores(): void;
}

declare module '*/core/http.js' {
  export interface RequestConfig {
    method?: string;
    headers?: Record<string, string>;
    body?: any;
    params?: Record<string, string>;
  }

  export class HttpClient {
    setBaseUrl(url: string): void;
    setHeaders(headers: Record<string, string>): void;
    addRequestInterceptor(fn: (config: RequestConfig) => RequestConfig): void;
    addResponseInterceptor(fn: (response: Response) => Response): void;
    setErrorHandler(fn: (error: Error, config: RequestConfig) => void): void;
    request<T = any>(url: string, config?: RequestConfig): Promise<T>;
    get<T = any>(url: string, config?: RequestConfig): Promise<T>;
    post<T = any>(url: string, body?: any, config?: RequestConfig): Promise<T>;
    put<T = any>(url: string, body?: any, config?: RequestConfig): Promise<T>;
    patch<T = any>(url: string, body?: any, config?: RequestConfig): Promise<T>;
    delete<T = any>(url: string, config?: RequestConfig): Promise<T>;
  }

  export const http: HttpClient;
}

declare module '*/core/event-bus.js' {
  export class EventBusClass {
    on(event: string, handler: (data: any) => void): void;
    once(event: string, handler: (data: any) => void): void;
    off(event: string, handler: (data: any) => void): void;
    emit(event: string, data?: any): void;
    clear(event: string): void;
    clearAll(): void;
  }

  export const EventBus: EventBusClass;
}

declare module '*/core/utils.js' {
  export function deepClone<T>(obj: T): T;
  export function debounce<T extends (...args: any[]) => any>(fn: T, delay?: number): T;
  export function throttle<T extends (...args: any[]) => any>(fn: T, interval?: number): T;
  export function uid(prefix?: string): string;
  export function toKebab(str: string): string;
  export function toCamel(str: string): string;
  export function pascalToKebab(str: string): string;
  export function getByPath(obj: any, path: string, defaultValue?: any): any;
  export function escapeHtml(str: string): string;
  export function renderTemplate(html: string, data?: Record<string, any>): string;
  export function parseQuery(searchStr: string): Record<string, string>;
  export function toQueryString(obj: Record<string, string>): string;
}

declare module '*/config.js' {
  export interface Config {
    appName: string;
    routerMode: 'history' | 'hash';
    appContainer: string;
    defaultLayout: string | null;
    apiBaseUrl: string;
    requestTimeout: number;
    debug: boolean;
  }

  export const config: Config;
  export function setConfig(partial: Partial<Config>): void;
}

// Global window extensions
declare global {
  interface Window {
    $router?: import('*/core/router.js').Router;
    $http?: import('*/core/http.js').HttpClient;
  }
}

export {};
