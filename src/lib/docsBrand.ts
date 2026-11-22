import { brandDisplayText } from "../shared/utils/brandDisplayText";

export const brandDocsText = brandDisplayText;

type DocNode = { type: string; value?: string; children?: DocNode[]; alt?: string };

// Fumadocs assigns heading IDs before custom remark plugins run.
export function remarkDocsBrand() {
  function transform(node: DocNode) {
    if (node.type === "text" && node.value) node.value = brandDocsText(node.value);
    if (node.type === "image" && node.alt) node.alt = brandDocsText(node.alt);
    node.children?.forEach(transform);
  }
  return transform;
}
