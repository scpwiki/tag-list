import { parseConfig, TomlParseError, ConfigParseError } from "../src/parser"

describe("config parser", () => {
  it("fails on invalid TOML input", () => {
    expect(() => parseConfig("[aa")).toThrow(TomlParseError)
    expect(() => parseConfig("aa = \"bb")).toThrow(TomlParseError)
    expect(() => parseConfig("[category/]")).toThrow(TomlParseError)
  })

  it("parses a config", () => {
    expect(parseConfig(`
      ["category/"]
      name = "category"
      description = "category description"
      [tag-1]
      description = "a tag"
      requires = [ "tag-2" ]
      [tag-2]
      [[section]]
      name = "a section"
      [section.tag-3]
    `)).toEqual(
      {
        id: "category/",
        name: "category",
        description: "category description",
        tags: {
          "tag-1": { description: "a tag", requires: ["tag-2"] },
          "tag-2": {}
        },
        sections: [
          { name: "a section", tags: { "tag-3": {} } }
        ]
      }
    )
  })

  it("parses a minimal config", () => {
    expect(parseConfig("['category/']")).toEqual(
      { id: "category/", sections: [], tags: {} }
    )
  })

  it("fails if no category is configured", () => {
    expect(() => parseConfig("[tag]")).toThrow(ConfigParseError)
  })

  it("fails if more than one category is configured", () => {
    expect(() => parseConfig("['1/']\n['2/']")).toThrow(ConfigParseError)
  })

  it("fails when unexpected values are passed", () => {
    expect(() => parseConfig(`
      ['category/']
      description = [ "XXX" ]
    `)).toThrow(ConfigParseError)
  })

  it("fails when a flat relationship property contains a nested list", () => {
    expect(() => parseConfig(`
      ['c/']
      [tag-1]
      related = [["tag-2"]]
    `)).toThrow(ConfigParseError)
  })

  it("supports relationships defined in categories", () => {
    expect(parseConfig(`
      ["category/"]
      requires = [ "tag-1" ]
    `)).toEqual(
      {
        id: "category/",
        name: undefined,
        description: undefined,
        requires: ["tag-1"],
        tags: {},
        sections: []
      }
    )
  })

  it("supports relationships defined in sections", () => {
    expect(parseConfig(`
      ["category/"]
      [tag-1]
      [[section]]
      requires = ["tag-1"]
    `)).toEqual(
      {
        id: "category/",
        name: undefined,
        description: undefined,
        tags: { "tag-1": {} },
        sections: [
          {
            name: undefined,
            description: undefined,
            requires: ["tag-1"],
            tags: {}
          }
        ]
      }
    )
  })
})
