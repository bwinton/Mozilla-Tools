#!/usr/bin/env python

from appscript import app, k
from BeautifulSoup import BeautifulSoup
import re
import sys
import urllib

url = "https://bugzilla.mozilla.org/request.cgi?action=queue&requestee=bwinton@mozilla.com"
bugNum = re.compile("[0-9]*$")

print "url =",url
data = urllib.urlopen(url).read()
# data = open("test.data").read()
soup = BeautifulSoup(data)
table = soup.find("table", "requests")
if not table:
  print u"Review Queue Zero?!?  Congratulations!"
  sys.exit(0)
trs = table.findAll("tr")
headings = []
requests = []
for i,tr in enumerate(trs):
  # handle headings
  if (tr.findAll("th")):
    headings = [th.contents[0] for th in tr.findAll("th")]
    continue
  request = [None, None]
  for j,td in enumerate(tr.findAll("td")):
    if headings[j] == u"Bug":
      request[1] = bugNum.search(td.a[u"href"]).group()
    if headings[j] == u"Flag":
      flag = unicode(td.contents[0]).strip()
      flag = flag.replace("review", "Review")
      flag = flag.replace("ui", "UI")
      flag = flag.replace("feedback", "Give feedback on")
      request[0] = flag
  requests.append(request)

requests.reverse()

things = app("Things")
for flag, bug in requests:
  name = u"%s bug %s." % (flag, bug)
  todo = things.to_dos[name]
  if (not things.to_dos.exists(todo)) or todo.status() == k.completed:
    print u"adding "+name
    todo = things.make(new=k.to_do,
                       with_properties={k.name: name},
                       at=things.lists[u'Today'].beginning)
    todo.tag_names.set(u"Mozilla")
    todo.area.set(things.areas[u"Work"])
  else:
    print u"skipping "+name
