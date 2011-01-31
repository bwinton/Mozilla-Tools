#!/usr/bin/env python

from mercurial import ui, hg
import re
import redis

# Constants.
BUG_DB = 1
FILE_DB = 2

ext = re.compile("(\.c(pp)?|\.js|\.xml)$")
bugRe = re.compile("^bug ([0-9]+)")

repo = hg.repository(ui.ui(), '.')
changes = [repo[i] for i in repo
                   if repo[i].description().lower().startswith("bug ")]

# populate the files by bug number.
bugDb = redis.Redis(db=BUG_DB)
for change in changes:
  bugNum = bugRe.match(change.description().lower()).groups(1)
  files = [f for f in change.files() if ext.search(f)]
  for f in files:
    bugDb.sadd(bugNum, f)

# Populate the file sets by file.
fileDb = redis.Redis(db=FILE_DB)
for key in bugDb.keys():
  print key
  files = bugDb.smembers(key)
  for file in files:
    print file
    for otherFile in files:
      fileDb.zincrby(file, otherFile)
