#! /usr/bin/env python
# coding=UTF-8

import appscript
import re
import subprocess
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
    def __init__(self):
        self.indent = 0
        self.insert = []

    def print_name(self, key, suffix=""):
        self.insert.append(self.indent * " " + "* ")
        self.insert.append(key.encode("utf-8"))
        self.insert.append(suffix + "\n")

    def gather_todos(self, things, list, future=False):
        todos = things.lists.ID(list)().to_dos()
        rv = {}
        for todo in todos:
            if todo.name() == "Update my status!":
                if len(rv) > 0 and not future:
                    break
                else:
                    continue
            if self.mozTag in todo.tags():
                area = ""
                if todo.project():
                    area = todo.project.name()
                elif todo.area():
                    area = todo.area.name()
                elif "meeting" in todo.name().lower() or "talk to" in todo.name().lower():
                    area = "Meetings"
                if area == "":
                    area = "Work"
                rv.setdefault(area, []).append(todo)
        return rv

    def print_area(self, area, values):
        if area != "Work":
            self.print_name(area, ":")
            self.indent += 2
            values.reverse()
        else:
            values.sort(key=lambda v: v.name())
        # coallesce items that contain "bug", and start with the same prefix.
        names = []
        vnames = {}
        for value in values:
            name = value.name()
            index = name.find("bug")
            if index != -1:
                prefix = name[:index]
                bug = name[index:]
                if bug.endswith("."):
                    bug = bug[:-1]
                vnames.setdefault(prefix, []).extend([", ", bug])
            else:
                names.append(name)
        # and put them at the end.
        for name in sorted(vnames.keys()):
            bugs = vnames[name][1:]
            if len(bugs) > 1:
                bugs[-2] = " and "
            names.append(name + "".join(bugs) + ".")

        for name in names:
            self.print_name(name)
        if area != "Work":
            self.indent -= 2

    def run(self, edit):
        things = appscript.app("Things")
        tags = things.tags()
        self.mozTag = None
        for tag in tags:
            if tag.name() == "Mozilla":
                self.mozTag = tag
                break

        self.insert.append("-----------------\n\n");
        areas = self.gather_todos(things, u"FocusLogbook")
        for area in sorted(areas.keys()):
            self.print_area(area, areas[area])

        self.insert.append("\n-----------------\n\n");
        areas = self.gather_todos(things, u"FocusToday", True)
        for area in sorted(areas.keys()):
            self.print_area(area, areas[area])

        self.insert.append("\n-----------------\n");

        self.insert = u"".join([x.decode("utf-8") for x in self.insert])
        # self.insert = self.insert.replace(u"…", u"...").replace(u"”", u'"').replace(u"“", u'"')
        self.view.insert(edit, 0, "".join(self.insert))


class HgPdiffCommand(sublime_plugin.TextCommand):
    def run(self, edit):
        process = subprocess.Popen('cd ' + self.view.window().folders()[0] + ';/usr/local/bin/hg pdiff',
                                    shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        out, err = process.communicate()
        if process.returncode == 0:
            self.view.insert(edit, 0, out)
            self.view.set_syntax_file(u'Packages/Diff/Diff.tmLanguage')
        else:
            self.view.insert(edit, 0, err)
            self.view.set_syntax_file(u'Packages/Text/Plain text.tmLanguage')

if __name__ == "__main__":
    cmd = WeeklyStatusCommand()
    cmd.view = StdoutView()
    cmd.run(None)
