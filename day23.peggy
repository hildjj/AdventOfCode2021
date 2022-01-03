inp = hall @first @mid last

hall = "#############\n#...........#\n"

first = "###" @pods "###\n"
mid = _ "#" @pods "#" _ "\n"

pods = head:pod tail:("#" @pod)+ { return [head, ...tail] }
last = _ "#########" _ "\n"

pod = [A-D]
_ = [ \t]*
