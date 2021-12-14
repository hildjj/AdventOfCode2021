input = initial:initial "\n\n" transforms:transforms {
  return { initial, transforms };
}

initial = [A-Z]+

transforms = transform+

transform = @$[A-Z]+ _ "->" _ @$[A-Z]+ "\n"

_ = [ \t]+
