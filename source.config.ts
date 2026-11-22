import { defineDocs, defineConfig } from "fumadocs-mdx/config";
import { remarkDocsBrand } from "./src/lib/docsBrand";

export const docs = defineDocs({
  dir: "docs",
  docs: {
    files: [
      "./getting-started/**/*.md",
      "./guides/**/*.md",
      "./architecture/**/*.md",
      "./reference/**/*.md",
      "./frameworks/**/*.md",
      "./routing/**/*.md",
      "./security/**/*.md",
      // Operator-internal: TLS impersonation, MITM decrypt, supply-chain
      // attestation, XOR-mask recipe. Stay in git; do not compile into /docs.
      "!./security/STEALTH_GUIDE.md",
      "!./security/SOCKET_DEV_FINDINGS.md",
      "!./security/MITM-TPROXY-DECRYPT.md",
      "!./security/PUBLIC_CREDS.md",
      "./compression/**/*.md",
      "./ops/**/*.md",
      "./providers/**/*.md",
      "./comparison/**/*.md",
    ],
  },
});

export default defineConfig({ mdxOptions: { remarkPlugins: [remarkDocsBrand] } });
