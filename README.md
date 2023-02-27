# tag-list

This is the tag documentation generator for the [English-speaking branch of the
SCP Wiki](https://scpwiki.com/).

The documentation generator implements (and is a proof-of-concept of) a
[prospective interface](src/tags/README.md) for defining tags that may in the
future be used by [Wikijump](https://github.com/scpwiki/wikijump/). Tags are
defined as [TOML](https://toml.io/) in order to be easily machine-readable, and
the documentation is designed to be as human-readable as reasonably possible.

You can see the [tag documentation
generator](https://05command.wikidot.com/tag-list-manifest) and the [tag
documentation itself](https://05command.wikidot.com/tech-hub-tag-list) in action
on [05command](https://05command.wikidot.com/), the SCP Wiki's staff site.

This project will be deprecated with the fruition of Wikijump, which will
contain native solutions for the problems this tool addresses.

## Usage

While the tool is designed to be as versatile as possible, please note that it
is currently only available in English.

### Installation

On Wikidot:

```
[[html]]
<script
  id="script"
  src="https://scpwiki.github.io/tag-list/tag-list.js?categoryCount=X&site=Y&page=Z"
></script>
[[/html]]
```

Replace `X` with the number of tag categories, `Y` with the URL of the wiki
with the page containing the tag list manifest, and `Z` with the slug (a.k.a.
"fullname" or "UNIX name") of that page. These parameters will be used to
autofill the input boxes in the tool, enabling most usage to be as simple as
clicking two buttons.

The tool does not need to be on the same page as the tag manifest.

### Defining the template

The tool expects that the first [code
block](https://www.wikidot.com/doc-wiki-syntax:code-blocks) on the page will
contain the documentation template, written as Wikitext with [Embedded
JavaScript](https://ejs.co/). See our implementation on 05command for an
example.

### Defining the manifest

The tool expects that all remaining code blocks on the page will contain TOML
files for tag categories.

See [instructions for setting up each tag category](src/tags/README.md).

When inserting the TOML into a code block, note that Wikidot does not support
TOML syntax highlighting &mdash; we recommend using `[[code type="python"]]`,
which seems to be close enough.

### Using the tool

The tool has an input for the URL of the documentation template, and a textarea
for the URLs of each category of the tag manifest. With proper query parameter
setup, these fields should be filled correctly automatically, but they can be
adjusted as needed. There is a button that will fetch these resources from
their URLs.

The tool also supports pasting the template or manifest
directly.

The tool will output the documentation template with all tags from the manifest
inserted. Any errors should be reported immediately, although you may need to
check the console for more details.

## Reporting issues

If there are any issues with this tool, please contact the [SCP Wiki Tech
Team](https://05command.wikidot.com/technical-staff-main).
