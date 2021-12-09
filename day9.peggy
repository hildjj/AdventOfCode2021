lines = (@line "\n")*

line = num+
num = [0-9]  { return parseInt(text(), 10) }
