/**
 * WebFast Diff - 基于真实 DOM 的 Diff 算法
 *
 * 功能：
 * - 对比两个 DOM 树，生成最小操作集
 * - 支持 key-based 子节点 diff（列表高效重排）
 * - 保留焦点、滚动位置、表单值等用户状态
 * - 纯原生 JS，零依赖
 *
 * 用法：
 *   import { diff, patch, preserveState } from '../core/diff.js';
 *   const patches = diff(oldContainer, newContainer);
 *   preserveState(() => patch(oldContainer, patches));
 */

/**
 * 获取节点的 key（用于列表项匹配）
 * @param {Node} node
 * @returns {string|null}
 */
function getKey(node) {
  if (node.nodeType !== Node.ELEMENT_NODE) return null;
  return node.getAttribute('data-key') || node.getAttribute('id') || null;
}

/**
 * 检查两个节点是否相同类型（可复用）
 * @param {Node} a
 * @param {Node} b
 * @returns {boolean}
 */
function isSameNodeType(a, b) {
  if (a.nodeType !== b.nodeType) return false;
  if (a.nodeType === Node.TEXT_NODE) return true;
  if (a.nodeType === Node.ELEMENT_NODE) {
    return a.tagName === b.tagName;
  }
  return false;
}

/**
 * 对比两个节点的属性，生成属性更新操作
 * @param {Element} oldNode
 * @param {Element} newNode
 * @returns {Array<{type: 'setAttr'|'removeAttr', name: string, value?: string}>}
 */
function diffAttributes(oldNode, newNode) {
  const ops = [];
  const oldAttrs = oldNode.attributes;
  const newAttrs = newNode.attributes;

  // 收集旧属性
  const oldMap = new Map();
  for (let i = 0; i < oldAttrs.length; i++) {
    const attr = oldAttrs[i];
    oldMap.set(attr.name, attr.value);
  }

  // 收集新属性
  const newMap = new Map();
  for (let i = 0; i < newAttrs.length; i++) {
    const attr = newAttrs[i];
    newMap.set(attr.name, attr.value);
  }

  // 检查新增和修改的属性
  for (const [name, value] of newMap) {
    if (!oldMap.has(name) || oldMap.get(name) !== value) {
      ops.push({ type: 'setAttr', name, value });
    }
  }

  // 检查删除的属性
  for (const name of oldMap.keys()) {
    if (!newMap.has(name)) {
      ops.push({ type: 'removeAttr', name });
    }
  }

  return ops;
}

/**
 * 对比两个文本节点
 * @param {Text} oldNode
 * @param {Text} newNode
 * @returns {string|null} 新文本内容，null 表示无变化
 */
function diffText(oldNode, newNode) {
  if (oldNode.textContent !== newNode.textContent) {
    return newNode.textContent;
  }
  return null;
}

/**
 * 对比两个子节点列表（key-based diff）
 * @param {Array<Node>} oldChildren
 * @param {Array<Node>} newChildren
 * @returns {Array<{type: string, ...}>}
 */
export function diffChildren(oldChildren, newChildren) {
  const ops = [];

  // 1. 构建旧子节点的 key 映射
  const oldKeyMap = new Map();
  const oldNoKey = [];
  for (let i = 0; i < oldChildren.length; i++) {
    const key = getKey(oldChildren[i]);
    if (key) {
      oldKeyMap.set(key, { node: oldChildren[i], index: i });
    } else {
      oldNoKey.push({ node: oldChildren[i], index: i });
    }
  }

  // 2. 遍历新子节点，匹配或创建
  const usedOldKeys = new Set();
  const usedOldNoKey = new Set();
  const moves = []; // 记录需要移动的节点

  for (let i = 0; i < newChildren.length; i++) {
    const newChild = newChildren[i];
    const key = getKey(newChild);

    let matchedOld = null;

    if (key && oldKeyMap.has(key)) {
      // 按 key 匹配
      const oldInfo = oldKeyMap.get(key);
      if (isSameNodeType(oldInfo.node, newChild)) {
        matchedOld = oldInfo;
        usedOldKeys.add(key);
      }
    } else if (!key && oldNoKey.length > 0) {
      // 无 key，按顺序匹配第一个未使用的同类型节点
      for (const oldInfo of oldNoKey) {
        if (!usedOldNoKey.has(oldInfo.index) && isSameNodeType(oldInfo.node, newChild)) {
          matchedOld = oldInfo;
          usedOldNoKey.add(oldInfo.index);
          break;
        }
      }
    }

    if (matchedOld) {
      // 递归 diff
      const childOps = diffNode(matchedOld.node, newChild);
      if (childOps.length > 0) {
        ops.push({
          type: 'updateChild',
          oldNode: matchedOld.node,
          newNode: newChild,
          ops: childOps,
        });
      }

      // 记录位置变化
      if (matchedOld.index !== i) {
        moves.push({ node: matchedOld.node, from: matchedOld.index, to: i });
      }
    } else {
      // 创建新节点
      ops.push({
        type: 'createChild',
        index: i,
        node: newChild,
      });
    }
  }

  // 3. 处理需要移除的旧节点
  for (const [key, oldInfo] of oldKeyMap) {
    if (!usedOldKeys.has(key)) {
      ops.push({ type: 'removeChild', node: oldInfo.node });
    }
  }
  for (const oldInfo of oldNoKey) {
    if (!usedOldNoKey.has(oldInfo.index)) {
      ops.push({ type: 'removeChild', node: oldInfo.node });
    }
  }

  // 4. 处理移动（按 from 位置降序处理，避免索引错乱）
  moves.sort((a, b) => b.from - a.from);
  for (const move of moves) {
    ops.push({
      type: 'moveChild',
      node: move.node,
      to: move.to,
    });
  }

  return ops;
}

/**
 * 对比两个节点，返回操作列表
 * @param {Node} oldNode
 * @param {Node} newNode
 * @returns {Array}
 */
function diffNode(oldNode, newNode) {
  const ops = [];

  // 1. 节点类型不同 -> 替换
  if (!isSameNodeType(oldNode, newNode)) {
    return [{ type: 'replace', newNode }];
  }

  // 2. 文本节点
  if (oldNode.nodeType === Node.TEXT_NODE) {
    const newText = diffText(oldNode, newNode);
    if (newText !== null) {
      ops.push({ type: 'setText', text: newText });
    }
    return ops;
  }

  // 3. 元素节点
  if (oldNode.nodeType === Node.ELEMENT_NODE) {
    // 3.1 对比属性
    const attrOps = diffAttributes(oldNode, newNode);
    if (attrOps.length > 0) {
      ops.push({ type: 'setAttrs', ops: attrOps });
    }

    // 3.2 对比子节点
    const oldChildren = Array.from(oldNode.childNodes);
    const newChildren = Array.from(newNode.childNodes);
    const childOps = diffChildren(oldChildren, newChildren);
    if (childOps.length > 0) {
      ops.push({ type: 'children', ops: childOps });
    }
  }

  return ops;
}

/**
 * 对比两个 DOM 树，生成 patch 操作列表
 * @param {Node} oldTree
 * @param {Node} newTree
 * @returns {Array} patch 操作列表
 */
export function diff(oldTree, newTree) {
  return diffNode(oldTree, newTree);
}

/**
 * 将 patch 操作应用到真实 DOM
 * @param {Node} rootNode
 * @param {Array} patches
 */
export function patch(rootNode, patches) {
  if (!patches || patches.length === 0) return;

  for (const op of patches) {
    applyPatch(rootNode, op);
  }
}

/**
 * 应用单个 patch 操作
 * @param {Node} contextNode
 * @param {object} op
 */
function applyPatch(contextNode, op) {
  switch (op.type) {
    case 'replace': {
      if (contextNode.parentNode) {
        contextNode.parentNode.replaceChild(cloneNode(op.newNode), contextNode);
      }
      break;
    }

    case 'setText': {
      contextNode.textContent = op.text;
      break;
    }

    case 'setAttrs': {
      for (const attrOp of op.ops) {
        if (attrOp.type === 'setAttr') {
          contextNode.setAttribute(attrOp.name, attrOp.value);
        } else if (attrOp.type === 'removeAttr') {
          contextNode.removeAttribute(attrOp.name);
        }
      }
      break;
    }

    case 'children': {
      for (const childOp of op.ops) {
        applyChildPatch(contextNode, childOp);
      }
      break;
    }

    default:
      break;
  }
}

/**
 * 应用子节点 patch 操作
 * @param {Element} parent
 * @param {object} op
 */
export function applyChildPatch(parent, op) {
  switch (op.type) {
    case 'createChild': {
      const newNode = cloneNode(op.node);
      if (op.index < parent.childNodes.length) {
        parent.insertBefore(newNode, parent.childNodes[op.index]);
      } else {
        parent.appendChild(newNode);
      }
      break;
    }

    case 'removeChild': {
      if (op.node.parentNode) {
        op.node.remove();
      }
      break;
    }

    case 'moveChild': {
      const refNode = parent.childNodes[op.to];
      if (refNode) {
        parent.insertBefore(op.node, refNode);
      } else {
        parent.appendChild(op.node);
      }
      break;
    }

    case 'updateChild': {
      patch(op.oldNode, op.ops);
      break;
    }

    default:
      break;
  }
}

/**
 * 将子节点 patch 操作列表应用到父元素
 * @param {Element} parent
 * @param {Array} patches
 */
export function patchChildren(parent, patches) {
  if (!patches || patches.length === 0) return;
  for (const op of patches) {
    applyChildPatch(parent, op);
  }
}

/**
 * 克隆节点（深拷贝）
 * @param {Node} node
 * @returns {Node}
 */
function cloneNode(node) {
  if (node.nodeType === Node.TEXT_NODE) {
    return document.createTextNode(node.textContent);
  }
  if (node.nodeType === Node.ELEMENT_NODE) {
    const clone = document.createElement(node.tagName);
    for (const attr of node.attributes) {
      clone.setAttribute(attr.name, attr.value);
    }
    for (const child of node.childNodes) {
      clone.appendChild(cloneNode(child));
    }
    return clone;
  }
  return node.cloneNode(true);
}

/**
 * 保留用户状态后执行 DOM 操作
 * 保留：焦点、滚动位置、表单值
 * @param {Function} fn - 执行 DOM 操作的函数
 */
export function preserveState(fn) {
  // 1. 记录焦点
  const activeElement = document.activeElement;
  const activeElementId = activeElement?.id || null;
  const activeElementSelector = activeElement
    ? getElementSelector(activeElement)
    : null;
  const selectionStart = activeElement?.selectionStart;
  const selectionEnd = activeElement?.selectionEnd;

  // 2. 记录所有滚动位置
  const scrollPositions = new Map();
  document.querySelectorAll('*').forEach((el) => {
    if (el.scrollTop > 0 || el.scrollLeft > 0) {
      scrollPositions.set(el, {
        top: el.scrollTop,
        left: el.scrollLeft,
      });
    }
  });

  // 3. 记录表单值
  const formValues = new Map();
  document.querySelectorAll('input, textarea, select').forEach((el) => {
    const key = getElementSelector(el);
    if (key) {
      formValues.set(key, {
        value: el.value,
        checked: el.checked,
        selectedIndex: el.selectedIndex,
      });
    }
  });

  // 4. 执行 DOM 操作
  fn();

  // 5. 恢复滚动位置
  for (const [el, pos] of scrollPositions) {
    if (document.contains(el)) {
      el.scrollTop = pos.top;
      el.scrollLeft = pos.left;
    }
  }

  // 6. 恢复表单值
  for (const [selector, data] of formValues) {
    const el = document.querySelector(selector);
    if (el) {
      if (data.value !== undefined) el.value = data.value;
      if (data.checked !== undefined) el.checked = data.checked;
      if (data.selectedIndex !== undefined) el.selectedIndex = data.selectedIndex;
    }
  }

  // 7. 恢复焦点
  if (activeElement) {
    let targetElement = null;
    if (activeElementId) {
      targetElement = document.getElementById(activeElementId);
    }
    if (!targetElement && activeElementSelector) {
      targetElement = document.querySelector(activeElementSelector);
    }
    if (targetElement) {
      targetElement.focus();
      // 只有支持 setSelectionRange 的元素才恢复选区
      if (
        selectionStart !== null &&
        selectionEnd !== null &&
        typeof targetElement.setSelectionRange === 'function'
      ) {
        targetElement.setSelectionRange(selectionStart, selectionEnd);
      }
    }
  }
}

/**
 * 获取元素的选择器（用于恢复定位）
 * @param {Element} el
 * @returns {string|null}
 */
function getElementSelector(el) {
  if (el.id) return `#${el.id}`;
  if (el.className) {
    const classes = el.className.split(' ').filter(Boolean).join('.');
    if (classes) return `${el.tagName.toLowerCase()}.${classes}`;
  }
  // 生成基于父元素的路径
  const path = [];
  let current = el;
  while (current && current !== document.body) {
    const tag = current.tagName.toLowerCase();
    const siblings = Array.from(current.parentNode?.children || []);
    const index = siblings.filter((s) => s.tagName === current.tagName).indexOf(current);
    path.unshift(`${tag}:nth-of-type(${index + 1})`);
    current = current.parentNode;
  }
  return path.length > 0 ? path.join(' > ') : null;
}
