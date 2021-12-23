// on x=-36..9,y=-8..38,z=-38..10

file = line+

line = dir:dir _ "x=" x:range ",y=" y:range ",z=" z:range "\n" {
  return { dir, coord: [x, y, z] }
}

range = @num ".." @num
dir
  = "on" { return 1 }
  / "off" { return 0 }

num = "-"? [0-9]+ { return parseInt(text(), 10) }
_ = [ \t]+
