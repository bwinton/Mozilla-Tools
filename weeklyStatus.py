#! /usr/bin/env python

import appscript
import sys
try:
  import sublime_plugin
except:
  class sublime_plugin(object):
    class TextCommand(object):
      pass
  class StdoutView(object):
    def insert(self, edit, region, data):
      sys.stdout.write(data)

class WeeklyStatusCommand(sublime_plugin.TextCommand):
  def run(self, edit):
    insert = []
    things = appscript.app("Things")
    tags = things.tags()
    mozTag = None
    for tag in tags:
      if tag.name() == "Mozilla":
        mozTag = tag
        break
    logbook = things.lists.ID(u"FocusLogbook")().to_dos()
    done = {}
    for todo in logbook:
      if len(done) > 0 and todo.name() == "Post my status!":
        break
      if mozTag in todo.tags():
        area = ""
        if todo.project():
          area = todo.project.name()
        elif todo.area():
          area = todo.area.name()
        if area == "":
          area = "Work"
        done.setdefault(area, []).append(todo)

    insert.append("<ul>\n")
    for key in sorted(done.keys()):
      values = done[key]
      if key == "DevTools":
        continue
      if key != "Work":
        insert.append("<li>")
        insert.append(key.encode("utf-8"))
        insert.append(":<ul>\n")
        values.reverse()
      else:
        # import pdb;pdb.set_trace()
        values.sort(key=lambda v: v.name())
      for (i, value) in enumerate(values):
        name = value.name()
        if name == "Drivers and Status Meetings.":
          continue
        index = name.find("bug")
        fixAnd = False
        if index != -1:
          prefix = name[:index]
          while i + 1 < len(values) and values[i + 1].name().startswith(prefix):
            name = name[:-1]
            name += ", " + values[i + 1].name()[index:]
            del values[i + 1]
            fixAnd = True
        if fixAnd:
          index = name.rfind(", ") + 2
          name = name[:index] + "and "+name[index:]
        if key != "Work":
          insert.append("  ")
        insert.append("<li>")
        insert.append(name.encode("utf-8"))
        insert.append("</li>\n")
      if key != "Work":
        insert.append("</ul></li>\n")
    insert.append("</ul>\n")
    self.view.insert(edit, 0, "".join(insert))

if __name__ == "__main__":
  cmd = WeeklyStatusCommand();
  cmd.view = StdoutView();
  cmd.run(None)