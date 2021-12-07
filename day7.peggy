lines = head:num tail:( "," @num)* "\n" { return [head, ...tail] }
num = [0-9]+  { return parseInt(text(), 10) }
