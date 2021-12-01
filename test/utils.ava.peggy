lines = lines:(@line "\n")* { return lines }

line = $[^\n]*
