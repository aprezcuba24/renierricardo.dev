/**
 * Turns ```mermaid fences into <div class="mermaid"> so Shiki does not
 * highlight them and the client can render with the mermaid package.
 */
export function remarkMermaid() {
  return (tree) => {
    walk(tree);
  };
}

function walk(node) {
  if (!node?.children?.length) return;

  for (let i = 0; i < node.children.length; i++) {
    const child = node.children[i];
    if (child.type === "code" && child.lang === "mermaid") {
      const escaped = String(child.value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
      node.children[i] = {
        type: "html",
        value: `<div class="mermaid">${escaped}</div>`,
      };
      continue;
    }
    walk(child);
  }
}
