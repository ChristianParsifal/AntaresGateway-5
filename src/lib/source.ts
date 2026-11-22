import { docs } from "../../.source/server";
import { loader } from "fumadocs-core/source";

import { brandDocsText } from "./docsBrand";

const generatedSource = docs.toFumadocsSource();

// Fumadocs currently emits non-page metadata for docs/openapi.yaml without a
// path. The loader assumes every source entry has a path, and Bun surfaces the
// resulting failure during Next page-data collection as an opaque ResolveMessage.
// OpenAPI is consumed by the API route, not the docs page tree, so omit it here.
const docsSource = {
  ...generatedSource,
  files: generatedSource.files
    .filter((file) => typeof file.path === "string")
    .map((file) => {
      if (file.type !== "page") return file;
      const { title, description } = file.data;
      return {
        ...file,
        data: {
          ...file.data,
          title: brandDocsText(title),
          description: description == null ? description : brandDocsText(description),
        },
      };
    }),
};

export const source = loader({
  baseUrl: "/docs",
  source: docsSource,
});
