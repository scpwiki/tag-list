## Properties for each tag

Where a property is a list of tags, a nested list is interpreted as 'at least one of these'.

This list also contains implementation recommendations for tag validation. Where possible, validation should prompt the user to make a change; it should not create or destroy information without the user's consent e.g. removing a tag is bad, but replacing a tag with one that contains it is fine if the user initiated that process.

Name | Defintion
--- | ---
**description** | Definition of this tag.
**requires** | Tags this tag requires. This tag cannot be added unless all required tags are already present. A circular dependency means that neither tag can be added; this should be considered a configuration error. One-way relationship.
**similar** | Conceptually-similar tags, or tags that might be required by this tag in a certain context. The user may be prompted to consider adding them. The prompt should not imply that the tag _should_ be added, or that the tag suggestion is based on the content of the article; it should encourage the user to read the tag's description and ascertain for themself whether or not it applies. One-way relationship.
**related** | Tags that this tag is related to, in ways that do not imply that the tags should or should not be applied together. One-way relationship.
**dissimilar** | Opposite-meaning or mildy-conflicting tags that this tag is not recommended to be used together with. A warning should appear if both are added. Two-way relationship.
**conflicts** | Tags that this tag should not be used together with. Addition of this tag will be blocked if all of these tags are present; if the tag is already present somehow, then new tag changes cannot be saved until the conflict is resolved. Two-way relationship.
**supersedes** | Tags that this tag overrides or conceptually contains. If such a tag is present, it should be removed automatically when this tag is added. A superseded tag should be treated as a conflicting tag if this tag is present. Two-way relationship.
