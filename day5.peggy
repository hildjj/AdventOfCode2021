lines = (@line "\n")*

line = @num "," @num _ "->" _ @num "," @num

num = [0-9]+ { return parseInt(text(), 10) }
_ = " "+
