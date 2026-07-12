import { parse } from "toml"
import {
  Array as ArrayRT, Dictionary, Intersect, Number, Partial as PartialRT,
  Static, String, Union
} from "runtypes"

/* Types for processed tag configuration objects */

const TagRelationshipListRuntype = ArrayRT(
  Union(String, ArrayRT(String))
)

const TagRelationshipsRuntype = PartialRT({
  requires: TagRelationshipListRuntype,
  similar: TagRelationshipListRuntype,
  related: TagRelationshipListRuntype,
  dissimilar: TagRelationshipListRuntype,
  conflicts: TagRelationshipListRuntype,
  supersedes: TagRelationshipListRuntype,
  // Stores final relationships summary strings
  _relationships: ArrayRT(String)
})
type TagRelationships = Static<typeof TagRelationshipsRuntype>

const TagRuntype = Intersect(
  PartialRT({
    'description': String,
    'description-plain': String
  }),
  TagRelationshipsRuntype
)
export type Tag = Static<typeof TagRuntype>

const TagDefinitionsRuntype = Dictionary(TagRuntype, "string")
type TagDefinitions = Static<typeof TagDefinitionsRuntype>

const TagCategoryPropertiesRuntype = PartialRT({
  name: String,
  description: String,
  max: Number
})
type TagCategoryProperties = Static<typeof TagCategoryPropertiesRuntype>

type TagCategorySection = {
  name?: string
  description?: string
  tags: TagDefinitions
} & TagRelationships

export type TagCategory = TagCategoryProperties & TagRelationships & {
  id: string
  tags: TagDefinitions
  sections: TagCategorySection[]
  _relationships?: string[]
}

/* Types for unprocessed category configuration as written in the TOML spec */

const TagCategoryCategoryConfigRuntype = Intersect(
  // Properties of the category
  TagCategoryPropertiesRuntype,
  // Base relationship properties applied to tags in the category
  TagRelationshipsRuntype
)

const TagCategorySectionConfigRuntype = ArrayRT(
  Intersect(
    // Properties of the section
    PartialRT({
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
  PartialRT({ section: TagCategorySectionConfigRuntype })
)

/**
 * Error type for invalid TOML documents, unrelated to tag specifics.
 */
export class TomlParseError extends Error {
  constructor (firstLine: string, line: number, column: number) {
    super(`TOML error in file ${firstLine}, line ${line} column ${column}`)
    this.name = "TomlParseError"
  }
}

/**
 * Error type for invalid tag config.
 */
export class ConfigParseError extends Error {
  constructor (message: string, categoryName: string) {
    super(`${message} in category ${categoryName}`)
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
    throw new TomlParseError(config.split("\n")[0], error.line, error.column)
  }

  // The TOML parser returns objects with a null prototype, which runtypes
  // erroneously interprets as being equal to null
  setObjectPrototype(rawCategoryConfig)

  // Validate primitive category config shape
  try {
    categoryConfig = TagCategoryConfigRuntype.check(rawCategoryConfig)
  } catch (error) {
    console.error(error)
    throw new ConfigParseError(error.message, config.split("\n")[0])
  }

  // Check that there is exactly one property ending in a slash
  const categoryKeys = Object.keys(categoryConfig).filter(
    key => key.endsWith("/")
  )
  if (categoryKeys.length !== 1) {
    const received = categoryKeys.length ? categoryKeys.join(", ") : "none"
    throw new ConfigParseError(
      `Config must define exactly one tag category, received: ${received}`,
      config.split("\n")[0]
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
    throw new ConfigParseError(
      `Category properties: ${(<Error>error).message}`, categoryName
    )
  }

  // Check that if section exists, it is a list of sections
  let categorySections: TagCategorySection[]
  try {
    if ("section" in categoryConfig) {
      categorySections = TagCategorySectionConfigRuntype.check(
        categoryConfig.section
      ).map(sectionConfig => {
        // Sections are set up sort of weird for a friendly-ish TOML syntax
        // Properties that are not tags need to be plucked
        let section: Partial<TagCategorySection> = {}
        for(const property of <const>[
          "name",
          "description",
          "requires",
          "similar",
          "related",
          "dissimilar",
          "conflicts",
          "supersedes",
        ]) {
          if (sectionConfig[property] != null)
            section = { ...section, [property]: sectionConfig[property] }
          delete sectionConfig[property]
        }

        // Remaining properties are tags
        return { ...section, tags: sectionConfig }
      })
      delete categoryConfig.section
    } else {
      categorySections = []
    }
  } catch (error) {
    throw new ConfigParseError(
      `Sections: ${(<Error>error).message}`, categoryName
    )
  }

  // Remaining properties are tags that are not in a section
  let categoryTags: TagDefinitions
  try {
    categoryTags = TagDefinitionsRuntype.check(categoryConfig)
  } catch (error) {
    throw new ConfigParseError(`Tags: ${(<Error>error).message}`, categoryName)
  }

  // Check that relationship properties do not have nested lists if they do not
  // support it
  Object.entries(<TagDefinitions>Object.assign(
    {}, categoryTags, categorySections, ...categorySections.map(s => s.tags)
  )).forEach(([tagName, tag]) => {
    (<const>["similar", "related", "dissimilar", "supersedes"]).forEach(
      property => {
        if (!tag[property]) {
          return
        }
        if (tag[property]?.some(r => Array.isArray(r))) {
          throw new ConfigParseError(
            `Property ${property} on ${tagName} cannot contain a nested list`,
            categoryName
          )
        }
      }
    )
  })

  const category: TagCategory = {
    id: categoryName,
    ...categoryCategoryConfig,
    tags: categoryTags,
    sections: categorySections
  }

  return category
}
