This is a VitePress rendered mirror of the [Godot Engine documentation](https://github.com/godotengine/godot-docs).

## Why?

I hate the Sphinx theme used in the official documentation. The sidebar navigation constantly shifts around as I click on different links making it difficult to keep track of where I am.

While it would be simpler to fork the documentation and write my own Sphinx theme, my maker's spirit and curiosity wanted to pursue an over-engineered solution. As a result, I spent my free time over the last several months writing an entire [reStructuredText compiler in TypeScript](https://github.com/trinovantes/rst-compiler) (I'm surprised it hasn't been done before!) just to compile the original documentation into markdown and then render the site in VitePress.

## Dev Notes

You will need the [Bun.js](https://bun.sh/) runtime before running the `compile` command.

```sh
# Clone this repo and official docs
git clone --recurse-submodules --shallow-submodules git@github.com:Trinovantes/godot-docs.git

# Compiles the original reStructuredText documentation into markdown
# This may take up to 3 minutes on a 12-core CPU
yarn compile

# Starts dev server at localhost:8080
yarn dev

# Builds for production at .vitepress/dist
yarn build
```
