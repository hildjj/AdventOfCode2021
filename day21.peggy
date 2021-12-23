players = player player

player = "Player " player:num " starting position: " pos: num "\n" {
  return {player, pos}
}

num = [0-9]+ { return parseInt(text(), 10) }
