lines = (@line "\n")*

line = n:$[^\n]* { return parseInt(n, 10) }
