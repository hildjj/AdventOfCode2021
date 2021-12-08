lines = (@line "\n")*

line = @map " | " @map
map = head:word tail:(" " @word)+ { return [head, ... tail]}
word = $[a-g]+
