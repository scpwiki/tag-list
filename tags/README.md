# Tag configuration files

## Tag categories

Tags are split into categories, with each category referring to a different concept. Each category has its own configuration file.

The first table in a category configuration file should be written `["name/"]`, where `name` is the name of the category (and also the name of the file). The `/` distinguishes it from tables that represent actual tags.

This category table can contain a description, which describes the category. It can also contain tag relationship properties, which will apply to every tag in the category. For example:

```toml
["my-category/"]
requires = [ "some-other-tag" ]

[tag-1]

[tag-2]
requires = [ "tag-1" ]

[tag-3]
requires = []
```

`tag-1` will require `some-other-tag`, `tag-2` will require both `some-other-tag` and `tag-1`, and `tag-3` will require `some-other-tag` (there is no way to undo relationships set by a category).

In addition to defaults for the relationship properties below, tag categories can also have the following properties:

Name | Description
--- | ---
**name** | The name of this category in a human-readable form; will be used in a sentence of the form "all tags from {name}".
**description** | A description of this category and why it contains the tags it does.
**max** | The maximum number of tags a page can have from this category.

A category can be split up into sections. Sections do not affect the functionality of tags, and it is not possible to select an entire section of tags (unlike categories). Sections only affect the tag documentation.

Create a new section with `[[section]]`. All tags that come after it, up until the next `[[section]]`, will be in that section. A tag that is defined before any section will not be in a section.

```toml
["my-category/"]
description = "..."

[tag-1]

[[section]]
name = "More tags"

[tag-2]
```

Sections can have the following properties:

Name | Property
--- | ---
**Name** | The name of the section.
**Description** | The description of the section.

## Properties for each tag

Each tag has a property for its definition, and also properties that determine its relationship with other tags.

Where a property is a list of tags, a nested list is interpreted as 'at least one of these'.

Where a tag ends in a forwards-slash, it is interpreted as a category name and means 'all tags from this category'. Those tags are joined by AND, unless the category name is in a nested list, in which case they are joined by OR. (For example, `requires = [ "category/" ]` means 'requires all tags from `category`', whereas `requires = [ [ "category/" ] ]` means 'requires at least one tag from `category`').

If a tag name is "\*", it refers to all tags; this is probably only useful with `conflicts` to indicate that this tag should only ever be by itself.

This list also contains implementation recommendations for tag validation. Where possible, validation should prompt the user to make a change; it should not create or destroy information without the user's consent e.g. removing a tag is bad, but replacing a tag with one that contains it is fine if the user initiated that process.

Name | Defintion
--- | ---
**description** | Definition of this tag.
**requires** | Tags this tag requires. This tag cannot be added unless all required tags are already present. A circular dependency means that neither tag can be added; this should be considered a configuration error. One-way relationship.
**similar** | Conceptually-similar tags, or tags that might be required by this tag in a certain context. The user may be prompted to consider adding them. The prompt should not imply that the tag _should_ be added, or that the tag suggestion is based on the content of the article; it should encourage the user to read the tag's description and ascertain for themself whether or not it applies. One-way relationship.
**related** | Tags that this tag is related to, in ways that do not imply that the tags should or should not be applied together. One-way relationship.
**dissimilar** | Opposite-meaning or mildy-conflicting tags that this tag is not recommended to be used together with. A warning should appear if both are added. Two-way relationship.
**conflicts** | Tags that this tag should not be used together with. Addition of this tag will be blocked if all of these tags are present; if the tag is already present somehow, then new tag changes cannot be saved until the conflict is resolved. If a tag conflicts with itself, the conflict is ignored. Two-way relationship.
**supersedes** | Tags that this tag overrides or conceptually contains. If such a tag is present, it should be removed automatically when this tag is added. A superseded tag should be treated as a conflicting tag if this tag is present. Two-way relationship.
