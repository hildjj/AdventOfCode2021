scanners = scanner+

// F it, I just added an extra newline to the input text.
scanner =  scanner:header beacons:beacons "\n" {
  return { scanner, beacons }
}

header = dashes __ "scanner" __ @num __ dashes "\n"
beacons = beacon+
beacon = @num "," @num "," @num "\n"

dashes = "---"
num = "-"? [0-9]+ { return parseInt(text(), 10) }
_ = [ \t]*
__ = [ \t]+
