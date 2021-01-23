import { makeRelationshipsString } from "../src/documentation"
import { Tag } from "../src/parser"

describe("requirements string generator", () => {
  it("generates requirement strings", () => {
    const expectations: [Tag, string][] = [
      [{}, ""],
      [{ requires: ["t"] }, "Requires 't'"],
      [{ requires: ["t1", "t2"] }, "Requires 't1', and 't2'"],
      [
        { requires: ["t1", "t2", ["t3", "t4"]] },
        "Requires 't1'; 't2'; and either 't3', or 't4'"
      ],
      [
        { requires: [["t1", "t2", "t3"], ["t4", "t5"]] },
        "Requires any of 't1', 't2', or 't3'; and either 't4', or 't5'"
      ],
      [
        { requires: ["c/"] },
        "Requires all tags from category 'c'"
      ],
      [
        { requires: ["t", "c/"] },
        "Requires 't', and all tags from category 'c'"
      ],
      [
        { requires: [["c/"]] },
        "Requires any of category 'c'"
      ],
      [
        { requires: [["t", "c/"]] },
        "Requires either 't', or any of category 'c'"
      ],
      [
        { requires: ["t1", ["t2", "t3"], "c1/", ["c2/", "t4", "c3/"]] },
        [
          "Requires 't1';",
          "either 't2', or 't3';",
          "all tags from category 'c1';",
          "and any of category 'c2', 't4', or any of category 'c3'"
        ].join(" ")
      ],
      [ { requires: [["t"]] }, "Requires 't'" ],
      [ { requires: [["c/"]] }, "Requires any of category 'c'" ],
    ]

    expectations.forEach(e => {
      expect(makeRelationshipsString(e[0])).toEqual(e[1])
    })
  })
})
