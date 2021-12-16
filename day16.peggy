line = n:$[^\n]* "\n" { return new Buffer(n, "hex") }
