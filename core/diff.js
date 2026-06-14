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
 * 对比两个子节点列表（优化版 key-based diff）
 * 采用 Vue/React 风格的双端比较 + LIS 最小移动算法
 * @param {Array<Node>} oldChildren
 * @param {Array<Node>} newChildren
 * @returns {Array<{type: string, ...}>}
 */
export function diffChildren(oldChildren, newChildren) {
  const ops = [];
  let oldStartIdx = 0;
  let oldEndIdx = oldChildren.length - 1;
  let newStartIdx = 0;
  let newEndIdx = newChildren.length - 1;

  // 1. 双端预处理：从头和尾同时比较，跳过相同节点
  while (oldStartIdx <= oldEndIdx && newStartIdx <= newEndIdx) {
    const oldStart = oldChildren[oldStartIdx];
    const oldEnd = oldChildren[oldEndIdx];
    const newStart = newChildren[newStartIdx];
    const newEnd = newChildren[newEndIdx];

    // 头头相同
    if (isSameNode(oldStart, newStart)) {
      const childOps = diffNode(oldStart, newStart);
      if (childOps.length > 0) {
        ops.push({ type: 'updateChild', oldNode: oldStart, newNode: newStart, ops: childOps });
      }
      oldStartIdx++;
      newStartIdx++;
      continue;
    }

    // 尾尾相同
    if (isSameNode(oldEnd, newEnd)) {
      const childOps = diffNode(oldEnd, newEnd);
      if (childOps.length > 0) {
        ops.push({ type: 'updateChild', oldNode: oldEnd, newNode: newEnd, ops: childOps });
      }
      oldEndIdx--;
      newEndIdx--;
      continue;
    }

    // 头尾交叉
    if (isSameNode(oldStart, newEnd)) {
      const childOps = diffNode(oldStart, newEnd);
      if (childOps.length > 0) {
        ops.push({ type: 'updateChild', oldNode: oldStart, newNode: newEnd, ops: childOps });
      }
      ops.push({ type: 'moveChild', node: oldStart, to: newEndIdx + 1 });
      oldStartIdx++;
      newEndIdx--;
      continue;
    }

    // 尾头交叉
    if (isSameNode(oldEnd, newStart)) {
      const childOps = diffNode(oldEnd, newStart);
      if (childOps.length > 0) {
        ops.push({ type: 'updateChild', oldNode: oldEnd, newNode: newStart, ops: childOps });
      }
      ops.push({ type: 'moveChild', node: oldEnd, to: newStartIdx });
      oldEndIdx--;
      newStartIdx++;
      continue;
    }

    break; // 双端无法匹配，进入 key-based 处理
  }

  // 2. 处理剩余节点：使用 key-map 进行精确匹配
  if (oldStartIdx <= oldEndIdx || newStartIdx <= newEndIdx) {
    // 构建旧节点 key 映射（仅针对剩余未处理的节点）
    const oldKeyMap = new Map();
    for (let i = oldStartIdx; i <= oldEndIdx; i++) {
      const key = getKey(oldChildren[i]);
      if (key) {
        oldKeyMap.set(key, { node: oldChildren[i], index: i });
      }
    }

    // 记录新节点序列中，哪些位置需要复用旧节点
    const newSequence = []; // { newNode, oldNode | null }[]
    const removedOldNodes = new Set(); // 需要删除的旧节点

    // 标记剩余旧节点为待删除
    for (let i = oldStartIdx; i <= oldEndIdx; i++) {
      removedOldNodes.add(oldChildren[i]);
    }

    // 遍历新节点，匹配或创建
    for (let i = newStartIdx; i <= newEndIdx; i++) {
      const newChild = newChildren[i];
      const key = getKey(newChild);
      let matchedOld = null;

      if (key && oldKeyMap.has(key)) {
        const oldInfo = oldKeyMap.get(key);
        if (isSameNodeType(oldInfo.node, newChild)) {
          matchedOld = oldInfo.node;
          removedOldNodes.delete(matchedOld); // 标记为复用，不移除
        }
      }

      newSequence.push({ newNode: newChild, oldNode: matchedOld });
    }

    // 3. 处理删除：移除未被复用的旧节点
    for (const node of removedOldNodes) {
      ops.push({ type: 'removeChild', node });
    }

    // 4. 处理创建和更新
    const patchedOldIndices = []; // 记录复用旧节点的原始索引
    for (let i = 0; i < newSequence.length; i++) {
      const { newNode, oldNode } = newSequence[i];
      const actualIndex = newStartIdx + i;

      if (oldNode) {
        // 复用旧节点：diff + 可能需要移动
        const childOps = diffNode(oldNode, newNode);
        if (childOps.length > 0) {
          ops.push({ type: 'updateChild', oldNode, newNode, ops: childOps });
        }
        patchedOldIndices.push({ node: oldNode, newIndex: actualIndex });
      } else {
        // 创建新节点
        ops.push({ type: 'createChild', index: actualIndex, node: newNode });
      }
    }

    // 5. 使用 LIS 计算最小移动操作
    if (patchedOldIndices.length > 1) {
      // 提取当前旧节点在父元素中的索引顺序
      const currentPositions = patchedOldIndices.map(item => {
        // 找到节点在原始 oldChildren 中的位置
        return oldChildren.indexOf(item.node);
      });

      // 计算 LIS（最长递增子序列）
      const lis = getLIS(currentPositions);
      const lisSet = new Set(lis);

      // 不在 LIS 中的节点需要移动
      for (let i = 0; i < patchedOldIndices.length; i++) {
        if (!lisSet.has(i)) {
          ops.push({
            type: 'moveChild',
            node: patchedOldIndices[i].node,
            to: patchedOldIndices[i].newIndex,
          });
        }
      }
    } else if (patchedOldIndices.length === 1) {
      // 只有一个复用节点，检查是否需要移动
      const { node, newIndex } = patchedOldIndices[0];
      const oldIndex = oldChildren.indexOf(node);
      // 如果位置变化了，需要移动
      if (oldIndex !== newIndex && oldIndex >= 0) {
        ops.push({ type: 'moveChild', node, to: newIndex });
      }
    }
  }

  return ops;
}

/**
 * 检查两个节点是否相同（用于双端比较）
 * 同时检查 key 和节点类型
 * @param {Node} a
 * @param {Node} b
 * @returns {boolean}
 */
function isSameNode(a, b) {
  if (!isSameNodeType(a, b)) return false;
  const keyA = getKey(a);
  const keyB = getKey(b);
  if (keyA || keyB) return keyA === keyB;
  return true;
}

/**
 * 计算最长递增子序列（LIS）
 * 返回的是索引数组，表示在原数组中的位置
 * @param {number[]} arr
 * @returns {number[]}
 */
function getLIS(arr) {
  if (arr.length === 0) return [];

  const tails = []; // tails[i] = 长度为 i+1 的递增子序列的最小末尾值
  const tailsIndices = []; // 对应的索引
  const prevIndices = new Array(arr.length).fill(-1); // 记录前驱节点

  for (let i = 0; i < arr.length; i++) {
    const num = arr[i];
    // 二分查找：找到 tails 中第一个 >= num 的位置
    let left = 0, right = tails.length;
    while (left < right) {
      const mid = (left + right) >> 1;
      if (tails[mid] < num) {
        left = mid + 1;
      } else {
        right = mid;
      }
    }

    if (left === tails.length) {
      tails.push(num);
      tailsIndices.push(i);
    } else {
      tails[left] = num;
      tailsIndices[left] = i;
    }

    // 记录前驱
    if (left > 0) {
      prevIndices[i] = tailsIndices[left - 1];
    }
  }

  // 回溯构建 LIS 索引
  const result = [];
  let current = tailsIndices[tailsIndices.length - 1];
  while (current !== -1) {
    result.unshift(current);
    current = prevIndices[current];
  }

  return result;
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
/**
 * 轻量克隆节点（复用已有 DOM 节点以减少 GC 压力）
 * 对于 Element 节点，优先复用 tagName 相同的旧节点
 * @param {Node} node
 * @param {Node} [oldNode] - 可选的旧节点，用于复用
 * @returns {Node}
 */
function cloneNode(node, oldNode) {
  if (node.nodeType === Node.TEXT_NODE) {
    return document.createTextNode(node.textContent);
  }
  if (node.nodeType === Node.ELEMENT_NODE) {
    // 尝试复用旧节点（相同标签类型）
    if (oldNode && oldNode.nodeType === Node.ELEMENT_NODE && oldNode.tagName === node.tagName) {
      // 复用旧节点，只更新属性
      for (const attr of oldNode.attributes) {
        if (!node.hasAttribute(attr.name)) {
          oldNode.removeAttribute(attr.name);
        }
      }
      for (const attr of node.attributes) {
        oldNode.setAttribute(attr.name, attr.value);
      }
      return oldNode;
    }
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
export function preserveState(fn, container = document) {
  // 1. 记录焦点
  const activeElement = document.activeElement;
  const activeElementId = activeElement?.id || null;
  const activeElementSelector = activeElement
    ? getElementSelector(activeElement)
    : null;
  const selectionStart = activeElement?.selectionStart;
  const selectionEnd = activeElement?.selectionEnd;

  // 2. 记录容器内滚动位置（限制范围，避免全文档扫描）
  const scrollPositions = new Map();
  const scrollables = container.querySelectorAll
    ? container.querySelectorAll('[data-preserve-scroll], .scrollable, [overflow-auto], [overflow-scroll]')
    : [];
  for (const el of scrollables) {
    if (el.scrollTop > 0 || el.scrollLeft > 0) {
      scrollPositions.set(el, {
        top: el.scrollTop,
        left: el.scrollLeft,
      });
    }
  }
  // 同时记录容器本身
  if (container.scrollTop > 0 || container.scrollLeft > 0) {
    scrollPositions.set(container, {
      top: container.scrollTop,
      left: container.scrollLeft,
    });
  }

  // 3. 记录容器内表单值
  const formValues = new Map();
  const forms = container.querySelectorAll
    ? container.querySelectorAll('input, textarea, select')
    : [];
  for (const el of forms) {
    const key = el.id || el.name || getElementSelector(el);
    if (key) {
      formValues.set(key, {
        value: el.value,
        checked: el.checked,
        selectedIndex: el.selectedIndex,
      });
    }
  }

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
  for (const [key, data] of formValues) {
    const el = key.startsWith('#')
      ? document.getElementById(key.slice(1))
      : container.querySelector?.(`[name="${key}"]`) || container.querySelector?.(key);
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
