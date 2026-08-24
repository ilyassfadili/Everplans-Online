import { Select } from "@/components/ui";
import { LIFE_IMPORTANT_ITEM_CATEGORIES, type LifeImportantItemCategory } from "@/types/life-planner";

import { IMPORTANT_ITEM_CATEGORY_LABEL } from "./important-item-visuals";

interface ImportantItemCategorySelectProps {
  defaultValue?: LifeImportantItemCategory;
  name?: string;
  id?: string;
}

/** The "what kind of important thing is this" control, shared by the composer (`new/_components/new-important-item-form.tsx`) and the detail page's own edit form. */
export function ImportantItemCategorySelect({ defaultValue = "note", name = "category", id }: ImportantItemCategorySelectProps) {
  const options = LIFE_IMPORTANT_ITEM_CATEGORIES.map((category) => ({ value: category, label: IMPORTANT_ITEM_CATEGORY_LABEL[category] }));

  return <Select id={id} name={name} defaultValue={defaultValue} options={options} aria-label="Category" />;
}
