import html from "./index.html"
import "./root.css"

import { render } from "ejs"
import {
  parseConfig, TagCategory, TomlParseError, ConfigParseError
} from "./parser"
import { makeRelationshipsStrings } from "./documentation"

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
 *
 * @param source - The section from which this error originates.
 * @param primer - A string with which to prefix the error message.
 * @param error - The error itself.
 */
function reportError (
  source: "template" | "definitions" | "output",
  primer: string,
  error?: Error
) {
  // TODO Pipe this back to the UI
  console.log(primer, error)
}

const numberOfTagFiles = 15
const site = "http://05command.wikidot.com"
const page = "tag-list-manifest"

// Generate code URLs for the config, assuming the template is first
const defaultsUrls = {
  template: `${site}/${page}/code/1`,
  definitions: Array.from({ length: numberOfTagFiles }).map((_, index) => {
    return `${site}/${page}/code/${index + 2}`
  })
}

// Track the value of the page template
let template = ""
// Track the tag category definitions
const definitions: { [category: string]: TagCategory } = {}

document.body.innerHTML = html;

const templateBox = el<HTMLTextAreaElement>("template")
const templateUrlBox = el<HTMLInputElement>("template-url")
const templateUrlButton = el<HTMLButtonElement>("template-url-button")
const definitionsBox = el<HTMLTextAreaElement>("definitions")
const definitionsUrlsBox = el<HTMLTextAreaElement>("definitions-urls")
const definitionsUrlsButton = el<HTMLButtonElement>("definitions-urls-button")
const definitionsErrors = el<HTMLDivElement>("definitions-errors")
const outputBox = el<HTMLTextAreaElement>("output")
const outputErrors = el<HTMLParagraphElement>("output-errors")

templateBox.addEventListener("input", () => {
  setState(["template", "output"], "waiting")
  template = templateBox.value
  setState(["template"], "done")
  makeOutput()
})

templateUrlButton.addEventListener("click", () => {
  setState(["template", "output"], "waiting")
  void fetchUrls([templateUrlBox.value]).then(template => {
    templateBox.value = template[0]
    setState(["template"], "done")
    templateBox.dispatchEvent(new Event("input"))
  })
})

definitionsBox.addEventListener("input", () => {
  setState(["definitions", "output"], "waiting")
  definitionsErrors.innerHTML = ""
  const config = definitionsBox.value
  definitionsBox.value = ""
  try {
    addCategory(config)
  } catch (error) {
    setState(["definitions", "output"], "failed")
    definitionsErrors.innerHTML = (<Error>error).message ?? "Unknown error"
    return
  }
  setState(["definitions"], "done")
  makeOutput()
})

definitionsUrlsButton.addEventListener("click", () => {
  setState(["definitions", "output"], "waiting")
  definitionsErrors.innerHTML = ""
  const errors: Error[] = []
  void fetchUrls(definitionsUrlsBox.value.split("\n")).then(configs => {
    configs.forEach(config => {
      try {
        addCategory(config)
      } catch (error) {
        errors.push(<Error>error)
      }
    })
    if (errors.length === 0) {
      setState(["definitions"], "done")
      makeOutput()
    } else {
      setState(["definitions", "output"], "failed")
      definitionsErrors.innerHTML = `<p>Errors:</p><ul><li>${
        errors.map(e => e.message ?? "Unknown error").join("</li><li>")
      }</li></ul>`
    }
  })
})

window.addEventListener("load", () => {
  templateUrlBox.value = defaultsUrls.template
  definitionsUrlsBox.value = defaultsUrls.definitions.join("\n")
  makeDefinitionsList()
})

/**
 * Handles the parsing and subsequent addition of a tag category to the
 * internal tag bank.
 *
 * @param config - The TOML config for this category.
 */
function addCategory(config: string): void {
  const definition = parseConfig(config)
  definitions[definition?.id] = definition
  makeDefinitionsList()
}

/**
 * Generates the Wikitext output from the given data, or reports errors that
 * are preventing it from generating correctly.
 */
function makeOutput (): void {
  outputErrors.innerHTML = ""
  // Generate relationship strings for each tag
  makeRelationshipsStrings(definitions)
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
    setState(["output"], "done")
  } catch (error) {
    if (error instanceof Error) {
      // Strip EJS-specific error trace
      const message = error.message.split("\n").reverse()[0]
      outputErrors.innerHTML = `Rendering error: ${message}`
    } else {
      outputErrors.innerHTML = `Error: ${String(error)}`
    }
    output = ""
    setState(["output"], "failed")
  }
  outputBox.value = output
}

/**
 * Generates the list of received category definitions
 */
function makeDefinitionsList (): void {
  let total = 0
  if (Object.keys(definitions).length > 0) {
    el("tags-received").innerHTML = Object.entries(definitions).map(
      ([categoryName, category]) => {
        categoryName = categoryName.slice(0, -1)
        const sections = category.sections.length
        const tags = Object.keys(category.tags).length
        const totalTags = category.sections.reduce((count, section) => {
          return count + Object.keys(section.tags).length
        }, 0) + tags
        total += totalTags
        return `<li>
          Category ${categoryName}:
          ${tags} tags and ${sections} sections
          for a total of ${totalTags} tags
        </li>`
      }
    ).join("")
  } else {
    el("tags-received").innerHTML = "<li>none so far</li>"
  }
  el("total-tags").innerHTML = total.toString()
}

/**
 * Fetches the contents of either the page template or a tag definition files
 * from a list of URLs.
 *
 * @param urls - A list of URLs to fetch.
 * @param callback - A callback that will be called with the text content of
 * each URL.
 * @returns A promise that resolves to a list of contents of the requested
 * resources.
 */
async function fetchUrls (urls: string[]): Promise<string[]> {
  // A CORS proxy is required to access the code blocks.
  // CodeTabs CORS Proxy is used here:
  // https://codetabs.com/cors-proxy/cors-proxy.html
  // This proxy has a limit of 5 requests per second, so a 200ms delay will be
  // inserted between each request.
  let delay = 0
  const delayIncrement = 200
  return await Promise.all(urls.map(async url => {
    delay += delayIncrement
    return new Promise(func => setTimeout(func, delay)).then(async () => {
      return await (
        await fetch(`https://api.codetabs.com/v1/proxy/?quest=${url}`)
      ).text()
    })
  }))
}

/**
 * Sets the state of one of the sections of the generator, which indicates
 * whether it's doing something or if it's finished.
 *
 * @param targets - A list of sections to set the state of.
 * @param state - The state to set.
 */
function setState (
  targets: ("template" | "definitions" | "output")[],
  state: "waiting" | "done" | "failed"
): void {
  const emojis = { waiting: "\u23f3", done: "\u2705", failed: "\u274c" }
  targets.forEach(target => {
    const indicator = el(`${target}-state`)
    indicator.textContent = emojis[state]
    if (state !== "waiting") {
      // Reset the indicator after a beat, unless it has changed
      setTimeout(() => {
        if (indicator.textContent === emojis[state]) {
          indicator.textContent = ""
        }
      }, 2000)
    }
  })
}
