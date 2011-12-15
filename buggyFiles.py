#!/usr/bin/env python

from mercurial import ui, hg
import operator
from os import stat
from os.path import exists
import re

ext = re.compile("(\.c(pp)?|\.js|\.xml)$")

repo = hg.repository(ui.ui(), '.')
print len([repo[i] for i in repo])
changes = [repo[i] for i in repo
                   if repo[i].description().lower().startswith("bug ")]
print len(changes)

master = {}

for change in changes:
  files = [f for f in change.files() if ext.search(f)]
  for f in files:
    master[f] = master.get(f, 0) + 1


counts = master.items()
counts.sort(key=operator.itemgetter(1))
counts.reverse()
print "Top files by number of bugs."
print "\n".join([c[0] + ":" + str(c[1]) for c in counts[:10]])

bugsPerByte = [(i[0], i[1] * 1000.0 / (stat(i[0]).st_size + 0.000001))
               for i in master.items()
               if exists(i[0])
               and i[0].find("test") == -1
               and i[0].find("modules") == -1]
bugsPerByte.sort(key=operator.itemgetter(1))
bugsPerByte.reverse()
print "\nTop files by bugs per kBytes."
print "\n".join([b[0] + ":" + str(b[1]) for b in bugsPerByte[:10]])

