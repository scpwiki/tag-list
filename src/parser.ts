import { parse } from "toml"
import {
  Array as ArrayRuntype, Dictionary, Intersect, Literal, Number, Partial,
  Static, String, Union
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

const TagRelationshipListRuntype = ArrayRuntype(
  Union(String, ArrayRuntype(String))
)

const TagRelationshipsRuntype = Partial({
  requires: TagRelationshipListRuntype,
  similar: TagRelationshipListRuntype,
  related: TagRelationshipListRuntype,
  dissimilar: TagRelationshipListRuntype,
  conflicts: TagRelationshipListRuntype,
  supersedes: TagRelationshipListRuntype,
  // Stores final relationships summary strings
  _relationships: ArrayRuntype(String)
})
type TagRelationships = Static<typeof TagRelationshipsRuntype>

const TagRuntype = Intersect(
  Partial({
    description: String,
    permissions: String // XXX is this right?
  }),
  TagRelationshipsRuntype
)
export type Tag = Static<typeof TagRuntype>

const TagDefinitionsRuntype = Dictionary(TagRuntype, "string")
type TagDefinitions = Static<typeof TagDefinitionsRuntype>

const TagCategoryPropertiesRuntype = Partial({
  name: String,
  description: String,
  max: Number,
  permissions: TagPermissionsRuntype
})
type TagCategoryProperties = Static<typeof TagCategoryPropertiesRuntype>

export type TagCategory = TagCategoryProperties & TagRelationships & {
  id: string
  tags: TagDefinitions
  sections: {
    name?: string
    description?: string
    tags: TagDefinitions
  }[]
  _relationships?: string[]
}

/* Types for unprocessed category configuration as written in the TOML spec */

const TagCategoryCategoryConfigRuntype = Intersect(
  // Properties of the category
  TagCategoryPropertiesRuntype,
  // Base relationship properties applied to tags in the category
  TagRelationshipsRuntype
)

const TagCategorySectionConfigRuntype = ArrayRuntype(
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
 * Error type for invalid TOML documents, unrelated to tag specifics.
 */
export class TomlParseError extends Error {
  constructor (message: string) {
    super(message)
    this.name = "TomlParseError"
  }
}

/**
 * Error type for invalid tag config.
 */
export class ConfigParseError extends Error {
  constructor (message: string) {
    super(message)
    this.name = "ConfigParseError"
  }
}

/**
 * Recursively converts an object with a null prototype to one with an object
 * protoype.
 */
function setObjectPrototype (nullObject: any) {
  if (typeof nullObject === "object") {
    if (Array.isArray(nullObject)) {
      nullObject.forEach(value => setObjectPrototype(value))
    } else {
      Object.setPrototypeOf(nullObject, Object.prototype)
      for (const key in nullObject) {
        setObjectPrototype(nullObject[key])
      }
    }
  }
}

/**
 * Parses and validates tags from TOML configuration.
 *
 * @param config - The body of a single tag category configuration file.
 */
export function parseConfig (config: string): TagCategory {
  let rawCategoryConfig: any
  let categoryConfig: Static<typeof TagCategoryConfigRuntype>

  // Validate TOML
  try {
    rawCategoryConfig = parse(config)
  } catch (error) {
    throw new TomlParseError("TOML parse error") // TODO more details
  }

  // The TOML parser returns objects with a null prototype, which runtypes
  // erroneously interprets as being equal to null
  setObjectPrototype(rawCategoryConfig)

  // Validate primitive category config shape
  try {
    categoryConfig = TagCategoryConfigRuntype.check(rawCategoryConfig)
  } catch (error) {
    console.error(error)
    throw new ConfigParseError("Config spec error") // TODO more details
  }

  // Check that there is exactly one property ending in a slash
  const categoryKeys = Object.keys(categoryConfig).filter(
    key => key.endsWith("/")
  )
  if (categoryKeys.length !== 1) {
    const received = categoryKeys.length ? categoryKeys.join(", ") : "none"
    throw new ConfigParseError(
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
    throw new ConfigParseError("Category definition does not match the spec")
  }

  // Check that if section exists, it is a list of sections
  let categorySections: Static<typeof TagCategorySectionConfigRuntype>
  try {
    if ("section" in categoryConfig) {
      categorySections = TagCategorySectionConfigRuntype.check(
        categoryConfig.section
      )
      delete categoryConfig.section
    } else {
      categorySections = []
    }
  } catch (error) {
    throw new ConfigParseError("Sections definition does not match the spec")
  }

  // Remaining properties are tags that are not in a section
  let categoryTags: TagDefinitions
  try {
    categoryTags = TagDefinitionsRuntype.check(categoryConfig)
  } catch (error) {
    throw new ConfigParseError("Tags definition does not match the spec")
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
