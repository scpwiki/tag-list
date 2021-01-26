import { makeRelationshipsStringsForTag } from "../src/documentation"
import { getTargets } from "../src/documentation"
import { TagCategory } from "../src/parser"

describe("relationship string generator", () => {
  it("generates relationship strings", () => {
    const c1 = {
      config: <TagCategory>{
        id: "c1",
        tags: {
          t1: { requires: ["t1"] },
          t2: { requires: ["t1", "t2"] },
          t3: { requires: ["t1", "t2", ["t3", "t4"]] },
          t4: { requires: [["t1", "t2", "t3"], ["t4", "t5"]] },
          t5: { requires: ["c1/"] },
          t6: { requires: ["t1", "c1/"] },
          t7: { requires: [["c1/"]] },
          t8: { requires: [["t1", "c1/"]] },
          t9: { requires: ["t1", ["t2", "t3"], "c1/", ["c2/", "t4", "c3/"]] },
          t10: { requires: [["t1"]] }
        },
        sections: []
      },
      strings: {
        t1: ["Requires 't1'"],
        t2: ["Requires 't1', and 't2'"],
        t3: ["Requires 't1'; 't2'; and either 't3', or 't4'"],
        t4: ["Requires any of 't1', 't2', or 't3'; and either 't4', or 't5'"],
        t5: ["Requires all tags from category 'c1'"],
        t6: ["Requires 't1', and all tags from category 'c1'"],
        t7: ["Requires any of category 'c1'"],
        t8: ["Requires either 't1', or any of category 'c1'"],
        t9: [[
          "Requires 't1';",
          "either 't2', or 't3';",
          "all tags from category 'c1';",
          "and any of category 'c2', 't4', or any of category 'c3'"
        ].join(" ")],
        t10: ["Requires 't1'"]
      }
    }

    Object.keys(c1.config.tags).forEach(tagName => {
      expect(makeRelationshipsStringsForTag(
        c1.config.tags[tagName], tagName, { c1: c1.config }
      )).toEqual(c1.strings[tagName])
    })
  })
})

describe("function that checks if a tag targets another", () => {
  it("returns the tag name if it does target", () => {
    expect(
      getTargets({ requires: ["t1", ["t2"]] }, "t1", "requires")("")
    ).toEqual("")
  })
  it("returns the tag name in an array if it is targeted in an array", () => {
    expect(
      getTargets({ requires: ["t1", ["t2"]] }, "t2", "requires")("")
    ).toEqual([""])
  })
  it("returns null if it doesn't target", () => {
    expect(
      getTargets({ requires: ["t1", ["t2"]] }, "t3", "requires")("")
    ).toEqual(null)
  })
})
