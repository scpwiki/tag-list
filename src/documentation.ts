/**
 * Functions for generating documentation about tags. Implementation-agnostic.
 */

import { Tag, TagCategory } from "./parser"

/**
 * Configuration for different relationship types.
 *
 * @property primer - Sentence fragment that precedes tag list, for context.
 * @property flat - Whether this relationship type can contain a 2nd-level
 * list. Also adds quantifiers such as "any of" and "all of".
 * @property combine - How to verbally combine the top-level list of tags.
 * Typically "and", but "or" can mean "and" when used in a negative context.
 * The second level is always "or"-combined.
 * @property inverse - A relationship to apply that points in the opposite
 * direction of the current relationship.
 */
const config = <const>{
  requires: {
    primer: "Requires",
    flat: false,
    combine: "and",
    inverse: null
  },
  similar: {
    primer: "Often used with",
    flat: true,
    combine: "and",
    inverse: null
  } ,
  related: {
    primer: "Compare with",
    flat: true,
    combine: "and",
    inverse: null
  },
  dissimilar: {
    primer: "Avoid using with",
    flat: true,
    combine: "or",
    inverse: "dissimilar"
  },
  conflicts: {
    primer: "Conflicts with",
    flat: false,
    combine: "and",
    inverse: "conflicts"
  },
  supersedes: {
    primer: "Supersedes",
    flat: true,
    combine: "and",
    inverse: null
    // supersedes/superseded have an asymmetric relationship, and the
    // superseded relationship type cannot be declared by the user, so there
    // is no need to declare it here
  },
  superseded: {
    primer: "Superseded by",
    flat: true,
    combine: "and",
    inverse: "supersedes"
  }
}

/**
 * Constructs strings describing a tag's relationships, and attaches them as a
 * list to each tag, replacing their _relationships property.
 *
 * @param definitions - The object containing all of the tag categories.
 */
export function makeRelationshipsStrings (
  definitions: { [category: string]: TagCategory }
): void {
  // Iterate over each of the 7 relationship types and construct strings for
  // each one
  Object.entries(definitions).forEach(([categoryName, category]) => {
    // Construct strings for the category
    category._relationships = makeRelationshipsStringsForTag(
      category, categoryName, definitions
    )
    // Construct strings for loose tags
    Object.entries(category.tags).forEach(([tagName, tag]) => {
      tag._relationships = makeRelationshipsStringsForTag(
        tag, tagName, definitions
      )
    })
    // Construct strings for sections
    Object.entries(category.sections).forEach(([sectionName, section]) => {
      section._relationships = makeRelationshipsStringsForTag(
        section, sectionName, definitions
      )
      // Construct strings for tags in sections
      Object.entries(section.tags).forEach(([tagName, tag]) => {
        tag._relationships = makeRelationshipsStringsForTag(
          tag, tagName, definitions
        )
      })
    })
  })
}

/**
 * Constructs all relationship strings for a single tag or category.
 *
 * @param tag - The tag to construct the strings for.
 * @param tagName - The name of the tag. TODO Attach to tag object.
 * @param definitions - The definitions of all tag categories in use.
 * @returns An array of the constructed strings.
 */
export function makeRelationshipsStringsForTag (
  tag: Tag,
  tagName: string,
  definitions: { [category: string]: TagCategory }
): string[] {
  return (<const>[
    "requires",
    "similar",
    "dissimilar",
    "conflicts",
    "supersedes",
    "superseded",
    "related"
  ]).map(relationship => {
    return makeRelationshipStringForTag(
      tag,
      tagName,
      relationship,
      definitions
    )
  }).filter((list): list is string => typeof list === "string")
}

/**
 * Constructs a string that describes one relationship of one tag.
 * Configuration for each relationship type is taken from the config object.
 *
 * @param tag - The tag to construct the string for.
 * @param tagName - The name of the tag. TODO Attach to tag object.
 * @param relationship - The type of the relationship.
 * @param definitions - The definitions of all tag categories in use.
 * @returns The constructed string, or null if there is no appropriate string.
 */
function makeRelationshipStringForTag (
  tag: Tag,
  tagName: string,
  relationship: keyof typeof config,
  definitions: { [category: string]: TagCategory }
): string | null {
  // Tags that this tag targets with the current relationship
  let forwardsTags: (string | string[])[]
  if (relationship === "superseded") {
    // 'supersedes' and 'superseded' are the only relationship types that are
    // both two-way and asymmetric. Only 'supersedes' can be configured.
    // 'superseded' is the only relationship type that cannot be manually
    // configured, so we can be sure that this tag definitely targets no tags
    // with that relationship type
    forwardsTags = []
  } else {
    // Otherwise, forwardsTags is the list of tags that this tag targets with
    // this relationship type, which can contain a nested list indicating "one
    // of these tags".
    forwardsTags = tag[relationship] ?? []
  }

  // Tags that target this tag with the inverse of the current relationship
  const inverse = config[relationship].inverse
  let backwardsTags: (string | string[])[]
  if (inverse == null) {
    // A one-way relationship type has no inverse relationship, so there are
    // definitely no tags that target this one with that nonexistent
    // relationship type
    backwardsTags = []
  } else {
    // Otherwise, get all the tags that target this tag with the inverse
    // relationship.
    // Iterate through all tags in all definitions to construct a list of tags
    // (and categories) that target this one.
    // If this tag is targeted in a nested list, put it into a nested list here
    // as well - for backwardsTags, a nested list therefore means "this tag may
    // be targeted by that tag" (though here a nested list will only ever
    // contain at most one tag)
    backwardsTags = Object.entries(definitions).reduce<(string | string[])[]>(
      (tagsThatTarget, [categoryName, category]) => {
        /**
         * Function that checks a tag to see if it targets this tag.  tagName
         * and tag refer to the tag that is currently being processed; tag2Name
         * and tag2 refer to the tag that is being checked to see if it targets
         * the current tag.
         *
         * @param tag2Name - The name of the tag being checked.
         * @param tag2 - The tag to be checked.
         *
         * Mutates local tagsThatTarget array to append tag2 if it targets the
         * tag that is currently being processed.
         */
        const checkTag = (tag2Name: string, tag2: Tag | TagCategory) => {
          const tags = getTargets(tag2, tagName, inverse)(tag2Name)
          if (tags != null) {
            tagsThatTarget.push(tags)
          }
        }
        // Check if this category targets this tag
        checkTag(categoryName, category)
        // Check for loose tags in this category that target this tag
        Object.entries(category.tags).forEach(entries => checkTag(...entries))
        // Check for tags in sections that target this tag
        category.sections.forEach(section => {
          Object.entries(section.tags).forEach(entries => checkTag(...entries))
        })
        return tagsThatTarget
      }, []
    )
  }

  // forwardsTags is a list of tags that this tag targets with the current
  // relationship; backwardsTags is a list of tags that target this tag with
  // the inverse relationship.
  // Unify them into a single list of targets
  const targets = [...forwardsTags, ...backwardsTags].filter(
    // Strip duplicates
    (target, index, targets) => targets.indexOf(target) === index
  )

  // If there are no targets, there is obviously no string to construct
  if (targets.length === 0) {
    return null
  }

  const text = targets.reduce<string>(
    (str, target, index) => {
      let text: string
      // Delimit with semicolons if text will also contain commas
      const hasNestedList = targets.some(target => {
        return Array.isArray(target)
      })
      const separator = (
        index === 0 ? "" : `${
          hasNestedList ? ";" : ","
        }${
          index === targets.length - 1 ? " and" : ""
        }`
      )
      // An OR list which is one tag is equivalent to an AND item; convert it
      if (
        Array.isArray(target) &&
        target.length === 1 &&
        !target[0].endsWith("/")
      ) {
        target = target[0]
      }
      if (Array.isArray(target)) {
        // Process an OR list
        text = target.reduce((text, tagName, index) => {
          const separator = (
            index === 0 ? "" : index === target.length - 1 ? ", or" : ","
          )
          let isCategory = false
          if (tagName.endsWith("/")) {
            isCategory = true
            tagName = tagName.slice(0, -1)
          }
          return `${text}${separator} ${
            isCategory ? `${index === 0 ? "" : "any of "}category ` : ""
          }'${tagName}'`
        }, target.length === 2 ? "either" : "any of")
      } else {
        // Process an AND item
        if (target.endsWith("/")) {
          text = `all tags from category '${target.slice(0, -1)}'`
        } else {
          text = `'${target}'`
        }
      }
      return `${str}${separator} ${text}`
    }, config[relationship].primer
  )
  return text
}

/**
 * Analyses a single relationship property of a single tag (or category) and
 * checks for the presence of a given target.
 *
 * @param tag - The tag in which to check for the target tag (though a tag
 * category will also be accepted).
 * @param target - The name of the target tag to check for.
 * @param relationship - The relationship type to check in.
 * @returns A function that, when the name of the tag or category is passed to
 * it, will return one of three values: null, if the tag does not target the
 * target; the name, if it does; and the name in an array, if the tag does
 * target the target but within a nested array.
 */
export function getTargets (
  tag: Tag | TagCategory,
  target: string,
  relationship: keyof typeof config
): (tagName: string) => string | string[] | null {
  if (relationship !== "superseded" && tag[relationship]) {
    // target refers to the tag or category that this function is checking to
    // see if the given tag targets; target_ refers to a target tag of that
    // tag (which may be equal to the desired target).
    if (tag[relationship]?.some(target_ => target_ === target)) {
      return (tagName: string) => tagName
    }
    if (tag[relationship]?.some(target_ => (
      Array.isArray(target_) && target_.some(target_ => target_ === target)
    ))) {
      return (tagName: string) => [tagName]
    }
  }
  return () => null
}
