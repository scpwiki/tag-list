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

const TagDefinitionsRuntype = Intersect(
  Dictionary(
    Partial({
      description: String,
      permissions: String // XXX is this right?
    }),
    "string"
  ),
  TagRelationshipsRuntype
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

const TagCategoryConfigRuntype = Intersect(
  // Properties of the category
  TagCategoryPropertiesRuntype,
  // Base relationship properties applied to tags in the category
  TagRelationshipsRuntype,
  // Tags not in a section
  TagDefinitionsRuntype,
  // Tag sections
  Partial({
    section: Array(
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
  })
)

/**
 * Parses and validates tags from TOML configuration.
 *
 * @param config - The body of a single tag category configuration file.
 */
export function parseConfig (config: string): TagCategory {
  const category = TagCategoryConfigRuntype.check(parse(config))
}
