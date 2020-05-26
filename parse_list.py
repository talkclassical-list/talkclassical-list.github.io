#!/usr/bin/env python

import json
import re
import jinja2
import string
from math import floor
from collections import Counter
import subprocess

from urllib import parse
from bs4 import BeautifulSoup
import networkx as nx
from graphviz import Graph

def parse_line(line):
  work = {}
  comp_loc = line.find(":")
  if comp_loc != -1:
    comp = line[:comp_loc].strip()
    work["comp"] = comp
  # rough year determination
  year_loc = line.rfind("[")
  if year_loc != -1:
    year_str = line[year_loc:].strip("[]")
    year_regex = re.search(r"\d{4}", year_str)
    if year_regex:
      work["year"] = int(year_regex.group())
      if str(work["year"]) != year_str:
        work["raw_yr"] = year_str
    elif "cent" in year_str:
      year_regex = re.search(r"\d{2}", year_str)
      if year_regex:
        work["year"] = int(year_regex.group()) * 100
        work["raw_yr"] = year_str
    work["title"] = line[comp_loc+1:year_loc].strip()
  else:
    work["title"] = line[comp_loc+1:].strip()

  return work

def parse_tier_list(name):
  works = []
  tier = -1
  main_part = False
  # used for storing last composer (wagner ring cycle)
  tmp_comp = None
  with open(name) as f:
    soup = BeautifulSoup(f, features="lxml")
    # find all of the tier titles
    html_tier_titles = soup.find_all("h1")[:-1]
    # find all of the tier uls (which immediately follow the titles)
    html_tier_lists = [None] * len(html_tier_titles)
    for i, title in enumerate(html_tier_titles):
      if title.next_sibling.name == "ul":
        html_tier = []
        for tier_sibling in title.next_siblings:
          if tier_sibling.name == "ul":
            html_tier += tier_sibling
          else:
            break
        html_tier_lists[i] = html_tier

    for tier, html_tier in enumerate(html_tier_lists):
      if html_tier:
        for html_work in html_tier:
          # sometimes strings are in multiple spans, so join all the strings together
          line = "".join(html_work.strings).strip()
          work = parse_line(line)
          work["tier"] = tier
          if not "comp" in work:
            work["comp"] = tmp_comp
          else:
            tmp_comp = work["comp"]
          # check if it's a link
          link = html_work.find("a")
          if link:
            # get the actual url from google url wrapping
            url = parse.urlparse(link["href"])
            work["thd"] = parse.parse_qs(url.query)["q"][0]

          # if it's not split into multiple pieces
          if not work["title"].endswith(":"):
            works.append(work)

  return works

def generate_word_trees(all_titles, min_size, min_freq):
  num_trees = 50

  word_tree = [nx.DiGraph() for _ in range(num_trees)]
  def get_word_tree(phrase_list, n, min_ct, matching_words=[], i=0, tree_idx=0):
    """
    Generates a word tree from a given list of phrases starting from the first word.
    Recursively searches for matching words in the phrase list.
    """
    words = [t[i] for t in phrase_list if \
        i == 0 or (i > 0 and len(t) > i and all(t[j] == word for j, word in enumerate(matching_words)))]
    top_words = [(w,c) for w,c in Counter(words).most_common(n) if c >= min_ct]
    for j, (w, ct) in enumerate(top_words):
      if i == 0:
        tree_idx = j
        word_tree[tree_idx].add_node(w, ct=ct)
      else:
        word_tree[tree_idx].add_edge(matching_words[-1], w)
        word_tree[tree_idx].nodes[w]["ct"] = word_tree[tree_idx].nodes[w].get("ct", 0) + ct
      get_word_tree(phrase_list, None, min_ct, matching_words + [w], i+1, tree_idx)
    return

  tree = get_word_tree(all_titles, num_trees, min_freq)
  word_tree = list(filter(lambda t: len(t.nodes()) > min_size, word_tree))

  def font_scale(x):
    o = 0.4
    return (1-o)*x + o

  outputs = []
  for idx, wt in enumerate(word_tree):
    # generate depths
    root = [n for n,d in wt.in_degree() if d==0][0]
    for n in wt.nodes:
      if n == root:
        wt.nodes[n]["depth"] = 0
      else:
        # find the longest path to a node (the "depth")
        wt.nodes[n]["depth"] = max(map(len, nx.all_simple_paths(wt, root, n)))

    tr = Graph(root, node_attr={"shape": "plaintext", "fontname": "Bodoni* 11 Medium", "color": "#333333"},
        edge_attr={"color": "#aaaaaa"}, strict=True)
    tr.attr(rankdir="LR")
    tr.attr(bgcolor="#f8f8f8")
    tr.attr(concentrate="true")
    if len(wt.nodes) > 20:
      tr.attr(ratio="0.5")
    else:
      tr.attr(ratio="0.2")
    fontsize=40
    # calculate node sizes based on its neighbours with same depth
    for n,ndata in wt.nodes(data=True):
      depth_sz = max(n2["ct"] for _,n2 in wt.nodes(data=True) if n2["depth"] == ndata["depth"])
      tr.node(n, fontsize=str(fontsize*font_scale(ndata["ct"]/depth_sz)))
    for n1,n2 in wt.edges():
      tr.edge(n1+":e",n2+":w")

    # generate in pdf, then convert to svg to keep the custom fonts
    gen_tr = tr.render(format="pdf", cleanup=True)
    output = root + ".svg"
    subprocess.call(["pdf2svg", gen_tr, "public/" + output])
    print("generated", root)
    outputs.append(output)
  return outputs

def ordinal(n):
  return "%d%s" % (n,"tsnrhtdd"[(floor(n/10)%10!=1)*(n%10<4)*n%10::4])

def is_active(self, tmpl):
  return "active" if self._TemplateReference__context.name.startswith(tmpl) else ""

if __name__ == "__main__":
  works = parse_tier_list("list.html")
  print("found", len(works), "works")
  with open("public/list.json", "w") as f:
    json.dump(works, f, ensure_ascii=False, separators=(",", ":"))

  # rework the list so templating is easier
  tiers = set(work["tier"] for work in works)
  tier_list = [[work for work in works if work["tier"] == tier] for tier in tiers]
  ord_tiers = [ordinal(t+1) for t in tiers]

  # get the year range
  years = [work.get("year", works[0]["year"]) for work in works]
  year_range = max(years) - min(years)

  all_titles = [[word.strip(",\"") for word in work["title"].split()] for work in works]

  trees = generate_word_trees(all_titles, 10, 3)

  render_env = jinja2.Environment(loader=jinja2.FileSystemLoader("tmpl"))
  render_env.globals["is_active"] = is_active
  render_env.trim_blocks = True
  render_env.lstrip_blocks = True
  with open("public/index.html", "w") as f:
    f.write(render_env.get_template("list.html").render(tier_list=zip(ord_tiers, tier_list)))
  with open("public/select/index.html", "w") as f:
    f.write(render_env.get_template("select.html").render())
  with open("public/stats/index.html", "w") as f:
    f.write(render_env.get_template("stats.html").render(num_works=len(works),
        num_comp=len(set(work["comp"] for work in works)),
        year_range=year_range, trees=trees))
