chunk
  = parens
  / squares
  / curlies
  / angles

parens = "(" chunk* ")"
squares = "[" chunk* "]"
curlies = "{" chunk* "}"
angles = "<" chunk* ">"
