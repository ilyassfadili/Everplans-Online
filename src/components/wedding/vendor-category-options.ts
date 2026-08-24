/**
 * The curated vendor category list (Prompt 4 Phase 3's own examples) -
 * shown as `Select` options in the vendor forms, but `wedding_vendors.category`
 * itself stays a plain text column (not a database enum), so a vendor
 * picking "Other" or a category added here later is never a schema
 * migration. Shared between the add-vendor form and the vendor detail
 * page's edit form so the two never drift out of sync.
 */
export const VENDOR_CATEGORY_OPTIONS = [
  { value: "Photography", label: "Photography" },
  { value: "Videography", label: "Videography" },
  { value: "Catering", label: "Catering" },
  { value: "Florist", label: "Florist" },
  { value: "DJ / Music", label: "DJ / Music" },
  { value: "Entertainment", label: "Entertainment" },
  { value: "Decor", label: "Decor" },
  { value: "Beauty", label: "Beauty" },
  { value: "Transportation", label: "Transportation" },
  { value: "Stationery", label: "Stationery" },
  { value: "Cake", label: "Cake" },
  { value: "Officiant", label: "Officiant" },
  { value: "Other", label: "Other" },
];
