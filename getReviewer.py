#!/usr/bin/env python

from collections import Counter
from mercurial import cmdutil, commands, hg, ui, url
from optparse import OptionParser
import os
import re
import sys

SEARCH_DEPTH = 10000
aliases = { 'lw': "luke",
            'philringnalda': "philor",
          }

fileRe = re.compile(r"^\+\+\+ (?:b/)?([^\s]*)", re.MULTILINE)
suckerRe = re.compile(r"[^s-]r=(\w+)")
supersuckerRe = re.compile(r"sr=(\w+)")
uisuckerRe = re.compile(r"ui-r=(\w+)")

def canon(reviewer):
  reviewer = reviewer.lower()
  return aliases.get(reviewer, reviewer)

def main(argv=None):
  if argv is None:
    argv = sys.argv
  parser = OptionParser()

  (options, args) = parser.parse_args()

  myui = ui.ui()
  repo = hg.repository(myui, cmdutil.findrepo(os.getcwd()))

  if len(args) == 0:
    # we should use the current diff, or if that is empty, the top applied
    # patch in the patch queue
    myui.pushbuffer()
    commands.diff(myui, repo, git=True)
    diff = myui.popbuffer()
    changedFiles = fileRe.findall(diff)
    if len(changedFiles) == 0:
      print("Patch source: top patch in mq queue")
      myui.pushbuffer()
      commands.diff(myui, repo, change="qtip", git=True)
      diff = myui.popbuffer()
    else:
      print("Patch source: current diff")
  else:
    diff = url.open(myui, args[0]).read()
    print("Patch source: %s" % args[0])

  changedFiles = fileRe.findall(diff)
  print("Changed files: " + str(changedFiles))
  changes = {}
  for changedFile in changedFiles:
    changes[changedFile] = []

  for revNum in xrange(len(repo) - SEARCH_DEPTH, len(repo)):
    rev = repo[revNum]
    for file in changedFiles:
      if file in rev.files():
        changes[file].append(rev)

  suckers = Counter()
  supersuckers = Counter()
  uisuckers = Counter()
  for file in changes:
    for change in changes[file]:
      suckers.update(canon(x) for x in suckerRe.findall(change.description()))
      supersuckers.update(canon(x) for x in supersuckerRe.findall(change.description()))
      uisuckers.update(canon(x) for x in uisuckerRe.findall(change.description()))

  print "Potential reviewers:"
  for (reviewer, count) in suckers.most_common(10):
    print "  %s: %d" % (reviewer, count)
  print

  print "Potential super-reviewers:"
  for (reviewer, count) in supersuckers.most_common(10):
    print "  %s: %d" % (reviewer, count)
  print

  print "Potential ui-reviewers:"
  for (reviewer, count) in uisuckers.most_common(10):
    print "  %s: %d" % (reviewer, count)
  print

  return 0

if __name__ == "__main__":
    sys.exit(main())

