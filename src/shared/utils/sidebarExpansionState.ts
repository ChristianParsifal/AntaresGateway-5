import type { SidebarSectionId } from "@/shared/constants/sidebarVisibility";

export function hydrateExpandedSections(
  storedExpanded: readonly SidebarSectionId[],
  pinned: ReadonlySet<SidebarSectionId>
): Set<SidebarSectionId> {
  if (storedExpanded.length === 0) return new Set();
  // Old versions stored pinned sections before the manually opened section.
  const section =
    [...storedExpanded].reverse().find((id) => !pinned.has(id)) ?? storedExpanded.at(-1);
  return section ? expandActiveSection(section) : new Set();
}

export function toggleExpandedSection(
  expanded: ReadonlySet<SidebarSectionId>,
  sectionId: SidebarSectionId
): Set<SidebarSectionId> {
  return expanded.has(sectionId) ? new Set() : expandActiveSection(sectionId);
}

export function expandActiveSection(sectionId: SidebarSectionId): Set<SidebarSectionId> {
  return new Set([sectionId]);
}
