import assert from "node:assert/strict";
import test from "node:test";
import { brandDocsText, remarkDocsBrand } from "../../src/lib/docsBrand";
import { brandMessageCatalog } from "../../src/shared/utils/brandDisplayText";

test("brands nested catalog values without changing keys or technical identifiers", () => {
  const original = {
    home: { welcome: "欢迎使用OmniRoute。", monitor: "OmniRoute CPU" },
    endpoint: { requestFlowOmniRoute: "Cheaper Inference · OmniRoute" },
    connection: "cheaperinference: X-OmniRoute-No-Cache, https://cheaper-inference.com",
  };
  assert.deepEqual(brandMessageCatalog(original), {
    home: { welcome: "欢迎使用AntaresGateway。", monitor: "AntaresGateway CPU" },
    endpoint: { requestFlowOmniRoute: "Antares Server · AntaresGateway" },
    connection: original.connection,
  });
  assert.equal(original.home.monitor, "OmniRoute CPU");
});

test("brands titles and prose while retaining technical names", () => {
  assert.equal(
    brandDocsText("了解OmniRoute。 OmniRoute's guide"),
    "了解AntaresGateway。 AntaresGateway's guide"
  );
  const technical =
    "https://github.com/cheaper-inference/OmniRoute @OmniRoute/client OmniRoute.exe omniroute";
  assert.equal(brandDocsText(technical), technical);
});

test("preserves code, heading anchors and link destinations", () => {
  const tree = {
    type: "heading",
    data: { hProperties: { id: "omniroute" } },
    children: [
      { type: "link", url: "/docs#omniroute", children: [{ type: "text", value: "OmniRoute" }] },
      { type: "inlineCode", value: "OmniRoute" },
    ],
  };
  remarkDocsBrand()(tree);
  assert.equal(tree.children[0].children?.[0].value, "AntaresGateway");
  assert.equal(tree.children[0].url, "/docs#omniroute");
  assert.equal(tree.children[1].value, "OmniRoute");
  assert.equal(tree.data.hProperties.id, "omniroute");
});
