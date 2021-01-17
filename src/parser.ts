import { parse } from "toml"

/* Types for processed tag configuration objects */

type TagName = string
type TagCategoryName = string

type TagPermissionsGroup = "anyone" | "author" | "staff"

type TagPermissions = {
  add?: TagPermissionsGroup
  remove?: TagPermissionsGroup
  modify?: TagPermissionsGroup
}

type TagRelationshipList = (
  (TagName | TagCategoryName) | (TagName | TagCategoryName)[]
)[]

type TagRelationshipProperties = {
  requires?: TagRelationshipList
  similar?: TagRelationshipList
  related?: TagRelationshipList
  dissimilar?: TagRelationshipList
  conflicts?: TagRelationshipList
  supersedes?: TagRelationshipList
}

type TagDefinitions = {
  [tag: string]: {
    description?: string
    permissions?: string
  } & TagRelationshipProperties
}

type TagCategoryProperties = {
  name?: string
  description?: string
  max?: number
  permissions?: TagPermissions
}

type TagCategory = TagCategoryProperties & TagRelationshipProperties & {
  id: TagCategoryName
  tags: TagDefinitions
  sections: {
    name?: string
    description?: string
    tags: TagDefinitions
  }[]
}

/* Types for unprocessed category configuration as written in the TOML spec */

type TagCategoryConfig = TagCategoryProperties & {
  section?: ({
    name?: string
    description?: string
  } & TagDefinitions)[]
} & TagDefinitions & TagRelationshipProperties

/**
 * Parses and validates tags from TOML configuration.
 *
 * @param config - The body of a single tag category configuration file.
 */
export function parseConfig (config: string): TagCategory {
  const category: unknown = parse(config)
}
