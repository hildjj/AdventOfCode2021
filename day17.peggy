line = "target area: x=" x:range ", y=" y:range "\n" { return { x, y} }

range = @num ".." @num

num = "-"? [0-9]+ { return parseInt(text(), 10) }
