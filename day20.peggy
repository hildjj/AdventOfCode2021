input = alg:algorithm "\n" "\n" image:image { return { alg, image } }

algorithm = line

line = bit+

image = (@line "\n")+

bit
  = light
  / dark

light = "#" { return 1 }
dark = "." { return 0 }
