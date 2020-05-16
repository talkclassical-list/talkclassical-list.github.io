#!/usr/bin/env python

import json
import re
import jinja2
from math import floor

def parse_tier_list(name):
  works = []
  tier = -1
  main_part = False
  # used for storing last composer (wagner ring cycle)
  tmp_comp = None
  with open(name) as f:
    lines = f.readlines()
    for i, line in enumerate(lines):
      # skip all the intro text
      if line.startswith("The First"):
        main_part = True
      # stop at the last (non) tier
      elif line.startswith("The Absolute"):
        break
      if main_part:
        line = line.strip(" \t\n\r*")
        # increment index if at title of next tier
        if line.startswith("The "):
          tier += 1
        elif len(line):
          comp_loc = line.find(":")
          comp = line[:comp_loc].strip()
          work = {"tier": tier}
          # if next line is indented, store current composer
          if lines[i+1][0] == " " and not tmp_comp:
            tmp_comp = comp
          else:
            # use the temporary storage
            if lines[i][0] == " ":
              work["comp"] = tmp_comp
            else:
              tmp_comp = None
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
            works.append(work)
  return works

def ordinal(n):
  return "%d%s" % (n,"tsnrhtdd"[(floor(n/10)%10!=1)*(n%10<4)*n%10::4])

if __name__ == "__main__":
  works = parse_tier_list("list.txt")
  with open("public/list.json", "w") as f:
    f.write(json.dumps(works))

  # rework the list so templating is easier
  tiers = set(work["tier"] for work in works)
  tier_list = [[work for work in works if work["tier"] == tier] for tier in tiers]
  ord_tiers = [ordinal(t+1) for t in tiers]
  render_env = jinja2.Environment(loader=jinja2.FileSystemLoader("tmpl"))
  render_env.trim_blocks = True
  render_env.lstrip_blocks = True
  with open("public/index.html", "w") as f:
    f.write(render_env.get_template("list.html").render(tier_list=zip(ord_tiers, tier_list)))
  with open("public/select/index.html", "w") as f:
    f.write(render_env.get_template("select.html").render())
  with open("public/stats/index.html", "w") as f:
    f.write(render_env.get_template("stats.html").render())
