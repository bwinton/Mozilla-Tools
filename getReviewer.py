#!/usr/bin/env python

from collections import Counter
from mercurial import commands, hg, ui
from optparse import OptionParser
import re
import sys

fileRe = re.compile(r"^\+\+\+ (?:b/)?(.*)$", re.MULTILINE)
suckerRe = re.compile(r"[^s-]r=([^, ]*)")
supersuckerRe = re.compile(r"sr=([^, ]*)")

def main(argv=None):
  if argv is None:
    argv = sys.argv
  parser = OptionParser()

  (options, args) = parser.parse_args()

  myui = ui.ui()
  repo = hg.repository(myui, '.')

  if len(args) == 0:
    # we should use the current diff.
    myui.pushbuffer()
    commands.diff(myui, repo, git=True)
    diff = myui.popbuffer()
  else:
    diff = open(args[0]).read()

  changedFiles = fileRe.findall(diff)
  changes = {}
  for changedFile in changedFiles:
    changes[changedFile] = []

  for revNum in xrange(len(repo) - 1000, len(repo)):
    rev = repo[revNum]
    for file in changedFiles:
      if file in rev.files():
        changes[file].append(rev)

  suckers = Counter()
  supersuckers = Counter()
  for file in changes:
    for change in changes[file]:
      suckers.update(x.lower() for x in suckerRe.findall(change.description()))
      supersuckers.update(x.lower() for x in supersuckerRe.findall(change.description()))

  print "Potential reviewers:"
  for (reviewer, count) in suckers.most_common(10):
    print "  %s: %d" % (reviewer, count)
  print

  print "Potential super-reviewers:"
  for (reviewer, count) in supersuckers.most_common(10):
    print "  %s: %d" % (reviewer, count)
  return 0

if __name__ == "__main__":
    sys.exit(main())

