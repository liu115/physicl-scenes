const BLOCKS = "h1, h2, p, figcaption, li";
const SKIP = "pre, code, script, style, svg, button";
const COMPOUND = /[\p{L}\p{N}]+(?:-[\p{L}\p{N}]+)+/gu;

function textNodes(root) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: (node) => (node.parentElement.closest(SKIP) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT),
  });
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  return nodes;
}

function keepCompoundsWhole(node) {
  const text = node.nodeValue;
  const matches = [...text.matchAll(COMPOUND)];
  if (!matches.length || node.parentElement.classList.contains("nowrap")) return;
  const fragment = document.createDocumentFragment();
  let index = 0;
  for (const match of matches) {
    fragment.append(text.slice(index, match.index));
    const span = document.createElement("span");
    span.className = "nowrap";
    span.textContent = match[0];
    fragment.append(span);
    index = match.index + match[0].length;
  }
  fragment.append(text.slice(index));
  node.replaceWith(fragment);
}

function glueLastTwoWords(block) {
  const nodes = textNodes(block).filter((n) => n.nodeValue.trim());
  for (let i = nodes.length - 1; i >= 0; i--) {
    const node = nodes[i];
    const value = node.nodeValue.replace(/\s+$/, "");
    const space = value.search(/\s\S*$/);
    if (space !== -1) {
      node.nodeValue = value.slice(0, space) + " " + value.slice(space + 1) + node.nodeValue.slice(value.length);
      return;
    }
  }
}

/**
 * Prevents two bad line breaks in every text block under `root`: a break inside a hyphenated
 * word ("high-|fidelity"), and a last line holding a single word. Wraps each hyphenated word in
 * `span.nowrap` and joins the last two words of each block with a no-break space. Mutates the
 * DOM; safe to call again on the same subtree.
 */
export function preventBadBreaks(root = document.body) {
  for (const node of textNodes(root)) keepCompoundsWhole(node);
  const blocks = root.matches?.(BLOCKS) ? [root] : [...root.querySelectorAll(BLOCKS)];
  for (const block of blocks) if (!block.closest(SKIP)) glueLastTwoWords(block);
}
