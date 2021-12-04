lines = (@line "\n")*

line = bit+
bit = n:[01] { return parseInt(n, 2) };
