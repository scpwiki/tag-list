import { parse } from "toml"
import {
  Array, Dictionary, Intersect, Literal, Number, Partial, Static, String, Union
} from "runtypes"

/* Types for processed tag configuration objects */

const TagPermissionsGroupRuntype = Union(
  Literal("anyone"), Literal("author"), Literal("staff")
)

const TagPermissionsRuntype = Partial({
  add: TagPermissionsGroupRuntype,
  remove: TagPermissionsGroupRuntype,
  modify: TagPermissionsGroupRuntype
})

const TagRelationshipListRuntype = Array(Union(String, Array(String)))

const TagRelationshipsRuntype = Partial({
  requires: TagRelationshipListRuntype,
  similar: TagRelationshipListRuntype,
  related: TagRelationshipListRuntype,
  dissimilar: TagRelationshipListRuntype,
  conflicts: TagRelationshipListRuntype,
  supersedes: TagRelationshipListRuntype
})
type TagRelationships = Static<typeof TagRelationshipsRuntype>

const TagDefinitionsRuntype = Dictionary(
  Intersect(
    Partial({
      description: String,
      permissions: String // XXX is this right?
    }),
    TagRelationshipsRuntype
  ),
  "string"
)
type TagDefinitions = Static<typeof TagDefinitionsRuntype>

const TagCategoryPropertiesRuntype = Partial({
  name: String,
  description: String,
  max: Number,
  permissions: TagPermissionsRuntype
})
type TagCategoryProperties = Static<typeof TagCategoryPropertiesRuntype>

type TagCategory = TagCategoryProperties & TagRelationships & {
  id: string
  tags: TagDefinitions
  sections: {
    name?: string
    description?: string
    tags: TagDefinitions
  }[]
}

/* Types for unprocessed category configuration as written in the TOML spec */

const TagCategoryCategoryConfigRuntype = Intersect(
  // Properties of the category
  TagCategoryPropertiesRuntype,
  // Base relationship properties applied to tags in the category
  TagRelationshipsRuntype
)

const TagCategorySectionConfigRuntype = Array(
  Intersect(
    // Properties of the section
    Partial({
      name: String,
      description: String
    }),
    // Tags in the section
    TagDefinitionsRuntype
  )
)

const TagCategoryConfigRuntype = Intersect(
  // Properties for category, defined on a key named <category>/, AND tags
  Dictionary(
    Union(
      // Main category config
      TagCategoryCategoryConfigRuntype,
      // Tags not in a section
      TagDefinitionsRuntype
    ),
    "string"
  ),
  // Tag sections
  Partial({ section: TagCategorySectionConfigRuntype })
)

/**
 * Parses and validates tags from TOML configuration.
 *
 * @param config - The body of a single tag category configuration file.
 */
export function parseConfig (config: string): TagCategory {
  // Validate TOML
  try {
    parse(config)
  } catch (error) {
    console.log(error)
    throw new Error("TOML parse error") // TODO more details
  }

  // Validate primitive category config shape
  try {
    TagCategoryConfigRuntype.check(parse(config))
  } catch (error) {
    throw new Error("Config spec error") // TODO more details
  }
  const categoryConfig = TagCategoryConfigRuntype.check(parse(config))

  // Check that there is exactly one property ending in a slash
  const categoryKeys = Object.keys(categoryConfig).filter(
    key => key.endsWith("/")
  )
  if (categoryKeys.length !== 1) {
    const received = categoryKeys.length ? categoryKeys.join(", ") : "none"
    throw new Error(
      `Config must define exactly one tag category, received: ${received}`
    )
  }
  const categoryName = categoryKeys[0]

  // Check that this property is a category config
  let categoryCategoryConfig: Static<typeof TagCategoryCategoryConfigRuntype>
  try {
    categoryCategoryConfig = TagCategoryCategoryConfigRuntype.check(
      categoryConfig[categoryName]
    )
    delete categoryConfig[categoryName]
  } catch (error) {
    throw new Error("Category definition does not match the spec")
  }

  // Check that if section exists, it is a list of sections
  let categorySections: Static<typeof TagCategorySectionConfigRuntype>
  try {
    categorySections = TagCategorySectionConfigRuntype.check(
      categoryConfig.section
    )
    delete categoryConfig.section
  } catch (error) {
    throw new Error("Sections definition does not match the spec")
  }

  // Remaining properties are tags that are not in a section
  let categoryTags: TagDefinitions
  try {
    categoryTags = TagDefinitionsRuntype.check(categoryConfig)
  } catch (error) {
    throw new Error("Tags definition does not match the spec")
  }

  const category: TagCategory = {
    id: categoryName,
    ...categoryCategoryConfig,
    tags: categoryTags,
    sections: categorySections.map(sectionConfig => {
      const name = sectionConfig.name
      const description = sectionConfig.description
      // Remove these non-tag properties (this is why they are reserved)
      delete sectionConfig.name
      delete sectionConfig.description
      // Remaining properties are tags
      const tags = sectionConfig
      return { name, description, tags }
    })
  }

  return category
}
