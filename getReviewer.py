#!/usr/bin/env python

from collections import Counter
from mercurial import commands, hg, ui
import operator
from optparse import OptionParser
from os import stat
from os.path import exists
import re
import sys

ext = re.compile("(\.c(pp)?|\.js|\.xml)$")
fileRe = re.compile(r"^\+\+\+ (?:b/)?(.*)$", re.MULTILINE)
suckerRe = re.compile(r"[^s-]r=([^, ]*)")
supersuckerRe = re.compile(r"sr=([^, ]*)")

def main(argv=None):
  if argv is None:
    argv = sys.argv
  parser = OptionParser()
  parser.add_option("-f", "--file", dest="filename",
                    help="write report to FILE", metavar="FILE")
  parser.add_option("-q", "--quiet",
                    action="store_false", dest="verbose", default=True,
                    help="don't print status messages to stdout")

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
      suckers.update(suckerRe.findall(change.description()))
      supersuckers.update(supersuckerRe.findall(change.description()))

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

