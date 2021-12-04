input = balls:balls "\n" boards:board+ { return { balls, boards } }

balls = head:num tail:("," @num)* { return [head, ...tail] }


board = "\n" @row+

row = _ head:num tail:(__ @num)+ "\n" { return [head, ...tail] }

num = [0-9]+ { return parseInt(text(), 10) }
_ = " "*
__ = " "+
