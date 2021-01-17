import html from "./index.html"
import "./root.css"

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

const numberOfTagFiles = 15

const defaults = {
  templateUrl: "http://05command.wikidot.com/master-tag-list/code/1",
  defintionsUrls: Array.from({ length: numberOfTagFiles }).map((_, index) => {
    return `http://05command.wikidot.com/master-tag-list/code/${index + 2}`
  }).join("\n")
}

document.body.innerHTML = html;

const templateBox = el<HTMLTextAreaElement>("template")
const templateUrlBox = el<HTMLInputElement>("template-url")
const definitionsBox = el<HTMLTextAreaElement>("definitions")
const definitionsUrlsBox = el<HTMLTextAreaElement>("definitions-urls")
const outputBox = el<HTMLTextAreaElement>("output")

templateBox.addEventListener("input", event => {
  template = templateBox.value
})
