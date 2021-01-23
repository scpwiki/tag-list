/**
 * Functions for generating documentation about tags. Implementation-agnostic.
 */

import { Tag } from "./parser"

/**
 * Constructs strings describing a tag's relationships.
 */
export function makeRelationshipsStrings (tag: Tag): string[] {
  const requires = tag.requires?.reduce<string>(
    (str, requirement, index, allRequirements) => {
      let text: string
      // Delimit with semicolons if text will also contain commas
      const hasNestedList = allRequirements.some(requirement => {
        return Array.isArray(requirement)
      })
      const separator = (
        index === 0 ? "" : `${
          hasNestedList ? ";" : ","
        }${
          index === allRequirements.length - 1 ? " and" : ""
        }`
      )
      // An OR list which is one tag is equivalent to an AND item; convert it
      if (
        Array.isArray(requirement) &&
        requirement.length === 1 &&
        !requirement[0].endsWith("/")
      ) {
        requirement = requirement[0]
      }
      if (Array.isArray(requirement)) {
        // Process an OR list
        text = requirement.reduce((text, tagName, index) => {
          const separator = (
            index === 0 ? "" : index === requirement.length - 1 ? ", or" : ","
          )
          let isCategory = false
          if (tagName.endsWith("/")) {
            isCategory = true
            tagName = tagName.slice(0, -1)
          }
          return `${text}${separator} ${
            isCategory ? `${index === 0 ? "" : "any of "}category ` : ""
          }'${tagName}'`
        }, requirement.length === 2 ? "either" : "any of")
      } else {
        // Process an AND item
        if (requirement.endsWith("/")) {
          text = `all tags from category '${requirement.slice(0, -1)}'`
        } else {
          text = `'${requirement}'`
        }
      }
      return `${str}${separator} ${text}`
    }, "Requires"
  )
  return [requires].filter((list): list is string => typeof list === "string")
}
