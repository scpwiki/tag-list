description: definition of the tag

requires: tags this tag requires; cannot be added without that tag
one-way relationship

similar: similar tags; user may be prompted to consider adding them
if item is a list of tags, interpret as "one of the following"
one-way relationship

related: tags that this tag is related to, in ways that do not imply that the
tags should or should not be applied together
one-way relationship

dissimilar: opposite-meaning or mildy-conflicting tags; user will be warned if
both are added
two-way relationship

conflicts: tags that if present will reject this tag from being added, and vice
versa
two-way relationship

supersedes: tags that this tag overrides; if that tag is present, it will be
removed automatically
one-way relationship
