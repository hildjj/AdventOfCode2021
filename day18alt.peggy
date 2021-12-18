lines = (@line "\n")*

line = n:$[^\n]* { return n }
