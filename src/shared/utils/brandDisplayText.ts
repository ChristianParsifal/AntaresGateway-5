// Presentation only. Preserve paths, protocol identifiers and package names.
export function brandDisplayText(text: string): string {
  return text
    .replace(/(?<![\w./@-])OmniRoute(?![\w/-]|\.[\w])/g, "AntaresGateway")
    .replace(
      /(?<![\w./@-])(?:CheaperInference|[Cc]heaper[ -][Ii]nference)(?![\w/-]|\.[\w])/g,
      "Antares Server"
    );
}

export function brandMessageCatalog(messages: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(messages).map(([key, value]) => [
      key,
      typeof value === "string"
        ? brandDisplayText(value)
        : value && typeof value === "object" && !Array.isArray(value)
          ? brandMessageCatalog(value as Record<string, unknown>)
          : value,
    ])
  );
}
