# talkclassical-list.github.io
Website for the Talk Classical Recommended List

## Setup

This is done automatically through GitHub Actions for GitHub Pages, but can also be done manually.

### Requirements

* Python:
  * Jinja2 (for HTML generation)
  * Graphviz (for word tree generation)
  * NetworkX (for word tree generation)

* `pdf2svg` for word tree generation
* A local copy of [Bodoni* 11 Medium](https://indestructibletype.com/fonts/Bodoni/Bodoni-11-Medium.otf) for word tree generation

### Procedure

Run
```
make update_list
```

The static files should be in `public/`.

## How it works

`make update_list` fetches the list from Google Docs as a `.txt` file, which is then parsed by [`parse_list.py`](parse_list.py) into a list of dicts representing each work, containing the year, title, tier, and composer (see `parse_tier_list()` for implementation).
This is then exported as a JSON file, so the interactive website components (selector, charts) can load it and manipulate the data.

The rest of the features can be built statically, so they are pre-generated.
The list itself is loaded into HTML Jinja templates, which are then rendered.

### Word tree generation

(see `generate_word_trees()`)

The most common first words in all titles are found, and the most common following words are recursively searched to obtain counts for each word appearance. These are used to create directed graphs using NetworkX, with each word acting as a node, and edges connecting words that appear in sequence.

To generate the final tree diagrams, these trees are loaded into Graphviz. All nodes are assigned a depth with a value of the longest path length from the root. These depth values are used to determine their respective sizes in the diagram, as each node's count is compared to others within the same depth and scaled accordingly relative to the largest count.

To make the edges cleaner, all ports are assigned to the east or west side, so they all flow from left to right. Also, the rank direction is set to left-right and the concentrate attribute is enabled to merge closer edges. The image aspect ratio is set to 0.5 for larger (>20 nodes) graphs and 0.2 for smaller graphs to prevent edges from flowing backwards in an "s" shape.

The final render is generated in `.pdf` form to preserve the font, and then converted into svg with `pdf2svg` for displaying on the website.
