# Tag configuration files

## Defining tag categories

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
**name** | The name of this category in a human-readable form.
**description** | A description of this category and why it contains the tags it does.
**max** | The maximum number of tags a page can have from this category.

A category can be split up into sections. Sections are primarily intended
to aid splitting up tag documentation for readability, but they can also be
used to apply relationships to all tags in the section (just like a tag
category).

It is not possible to select an entire section of tags (unlike categories)
in a tag relationship property.

Create a new section with `[[section]]`. All tags that come after it, up until the next `[[section]]`, must be defined as `[section.<name of tag>]` (otherwise they will not be in the section). For example:

```toml
["my-category/"]
description = "..."

[tag-1]

[[section]]
name = "More tags"

[section.tag-2]
```

In addition to defaults for the relationship properties below, sections can
have the following properties:

Name | Property
--- | ---
**name** | The name of the section.
**description** | The description of the section.

## Defining individual tags

Tags are defined by specifying its name as the title of a new table. It can
optionally contain additional properties.

### Naming tags

The following tag names are reserved: `name`, `description`.

Tags should only contain alphanumeric characters (`A-Z`, `a-z`, `0-9`), `_`,
and `-`.

However, a tag can be defined named `*` (which will need to be wrapped in quotes, so the final table definition would be `["*"]`), which defines a wildcard tag, allowing any arbitrary undefined tag to be created. Properties set on the wildcard tag apply to all undefined tags (as opposed to being applied to all tags).

### Tag properties

Name | Defintion | Implementation recommendation
--- | --- | ---
**description** | Definition of this tag. | The description is shown when adding a tag, and when the tag is suggested.

A tag can be defined with the following properties that indicate its relationship with other tags.

Name | Defintion | Implementation recommendation
--- | --- | ---
**requires** | A list of tags this tag requires. A circular dependency should be considered a configuration error. One-way relationship. | Addition of the tag is blocked unless all required tags are present.
**similar** | A list of conceptually-similar tags, or tags that might be required by this tag in a certain context but not all contexts, or tags that are commonly added with this tag. One-way relationship. | The user is prompted to consider adding these tags. The prompt should not imply that the tag _should_ be added, or that the tag suggestion is based on the content of the article; it should encourage the user to read the tag's description and ascertain for themself whether or not it applies.
**related** | A list of tags that this tag is related to, in ways that do not imply that the tags should or should not be applied together. One-way relationship. |
**dissimilar** | A list of opposite-meaning or mildy-conflicting tags that this tag is not recommended to be used together with. Two-way relationship. | A warning appears that prompts the user to consider removing tags.
**conflicts** | A list of tags that this tag must not be used together with. A tag cannot conflict with itself. Two-way relationship. | Addition of this tag will be blocked if all of these tags are present; if the tag is already present somehow, then new tag changes cannot be saved until the conflict is resolved.
**supersedes** | A list of tags that this tag overrides or conceptually contains. A superseded tag should be treated as a conflicting tag if this tag is present. Two-way relationship. | If such a tag is present, it should be removed automatically when this tag is added.

For the properties `requires` and `conflicts`, a nested list is interpreted as 'at least one of these'. The other properties do not support this feature and must be defined as a list of strings.

Where a tag ends in a forwards-slash, it is interpreted as a category name and means 'all tags from this category'. Those tags are joined by AND, unless the category name is in a nested list, in which case they are joined by OR. (For example, `requires = [ "category/" ]` means 'requires all tags from `category`', whereas `requires = [ [ "category/" ] ]` means 'requires at least one tag from `category`').

If a tag name in a list of tags is `"\*"`, it refers to the wildcard tag and hence to all undefined tags. If a tag name in a list of tags is `"\*/"`, it refers to all defined tags; this is probably only useful with `conflicts` to indicate that this tag should only ever be by itself.

Where possible, validation should prompt the user to make a change; it should not create or destroy information without the user's consent e.g. removing a tag is bad, but replacing a tag with one that contains it is fine if the user initiated that process.
