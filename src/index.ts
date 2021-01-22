import html from "./index.html"
import "./root.css"

import { render } from "ejs"
import {
  parseConfig, TagCategory, TomlParseError, ConfigParseError
} from "./parser"

/**
 * Gets an element of known ID and tag that is assumed to exist.
 *
 * @param id - The ID of the element to get.
 */
function el<T extends HTMLElement = HTMLElement>(id: string): T {
  const element = document.getElementById(id)
  if (element == null) {
    throw new Error(`${id} doesn't exist`)
  }
  return <T>element
}

/**
 * Reports an error back to the user.
 */
function reportError (primer: string, error: Error) {
  // TODO Pipe this back to the UI
  console.log(primer, error)
}

const numberOfTagFiles = 15

// Generate code URLs for the config, assuming the template is first
const defaultsUrls = {
  template: "http://05command.wikidot.com/master-tag-list/code/1",
  defintions: Array.from({ length: numberOfTagFiles }).map((_, index) => {
    return `http://05command.wikidot.com/master-tag-list/code/${index + 2}`
  }).join("\n")
}

// Track the value of the page template
let template = ""
// Track the tag category definitions
const definitions: { [category: string]: TagCategory } = {}

document.body.innerHTML = html;

const templateBox = el<HTMLTextAreaElement>("template")
const templateUrlBox = el<HTMLInputElement>("template-url")
const definitionsBox = el<HTMLTextAreaElement>("definitions")
const definitionsUrlsBox = el<HTMLTextAreaElement>("definitions-urls")
const outputBox = el<HTMLTextAreaElement>("output")
const outputErrors = el<HTMLParagraphElement>("output-errors")

templateBox.addEventListener("input", () => {
  template = templateBox.value
  makeOutput()
})

definitionsBox.addEventListener("input", () => {
  const config = definitionsBox.value
  definitionsBox.value = ""
  let definition
  try {
    definition = parseConfig(config)
  } catch (error) {
    if (error instanceof TomlParseError) {
      reportError("Couldn't read TOML", error)
    } else if (error instanceof ConfigParseError) {
      reportError("Config doesn't match specification", error)
    } else {
      throw error
    }
    return
  }
  definitions[definition?.id] = definition
  makeDefinitionsList()
  makeOutput()
})

/**
 * Generates the Wikitext output from the given data, or reports errors that
 * are preventing it from generating correctly.
 */
function makeOutput (): void {
  outputErrors.innerHTML = ""
  let output
  try {
    output = render(template, {
      getCategory: (name: string) => {
        if (!name.endsWith("/")) {
          throw new Error(
            `Template wants category '${name}', which does not end in '/'`
          )
        }
        if (name in definitions) {
          return definitions[name]
        }
        throw new Error(
          `Template wants category '${name}', but it has not been provided`
        )
      }
    })
  } catch (error) {
    if (error instanceof Error) {
      // Strip EJS-specific error trace
      const message = error.message.split("\n").reverse()[0]
      outputErrors.innerHTML = `Rendering error: ${message}`
    } else {
      outputErrors.innerHTML = `Error: ${String(error)}`
    }
    output = ""
  }
  outputBox.value = output
}

/**
 * Generates the list of received category definitions
 */
function makeDefinitionsList (): void {
  el("tags-received").innerHTML = Object.entries(definitions).map(
    ([categoryName, category]) => {
      categoryName = categoryName.slice(0, -1)
      const sections = category.sections.length
      const tags = Object.keys(category.tags).length
      const totalTags = category.sections.reduce((count, section) => {
        return count + Object.keys(section.tags).length
      }, 0) + tags
      return `<li>
        Category ${categoryName}:
        ${tags} tags and ${sections} sections for a total of ${totalTags} tags
      </li>`
    }
  ).join("")
}
