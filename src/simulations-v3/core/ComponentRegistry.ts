import type { ApparatusComponent, ComponentRegistry } from "./types";

/**
 * Registry implementation for apparatus components
 * Provides lookup by ID and category
 */
export function createComponentRegistry(
  components: readonly ApparatusComponent[],
): ComponentRegistry {
  const byId = new Map(components.map((c) => [c.id, c]));
  const byCategory = new Map<ApparatusComponent["category"], ApparatusComponent[]>();

  for (const component of components) {
    const list = byCategory.get(component.category) ?? [];
    list.push(component);
    byCategory.set(component.category, list);
  }

  return {
    components,
    getById(id: string) {
      return byId.get(id);
    },
    getByCategory(category: ApparatusComponent["category"]) {
      return byCategory.get(category) ?? [];
    },
  };
}
