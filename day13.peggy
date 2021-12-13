page = dots:dots "\n" folds:folds { return {dots, folds} }

dots = (@dot "\n")*

dot = @num "," @num

folds = ("fold along " @("x" / "y") "=" @num "\n")+

num = [0-9]+ { return parseInt(text(), 10) }
