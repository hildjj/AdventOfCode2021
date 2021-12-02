lines = (@line "\n")*

line
  = "forward" _ n:num { return [n, 0] }
  / "up"      _ n:num { return [0, -n] }
  / "down"    _ n:num { return [0, n] }

num = [0-9]+ { return parseInt(text(), 10) }
_ = [ \t]+
