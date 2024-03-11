describe('Telestrations Game', () => {
  describe('Join', () => {
    it('should throw an error if the player is already in the game', () => {
      // TODO
    });
    test('a player who joins is the last player in the rotation order', () => {
      // TODO
    });
  });

  describe('Leave', () => {
    it('should throw an error if the player is not in the game', () => {
      // TODO
    });
    test('if the game is in progress and any player leaves, the game ends', () => {
      // TODO
    });
    test('if the game is over and the player leaves, the state is not updated', () => {
      // TODO
    });
    test('if the game is WAITING_TO_START and a player leaves, the other players readiness is preserved', () => {
      // TODO
    });
    test('if the game is WAITING_TO_START and the only unready player leaves and there are two or more players, the game starts', () => {
      // TODO
    });
  });

  describe('StartGame', () => {
    it('only starts the game if there are two or more ready players', () => {
      // TODO
    });
    it('starts the game when all two or more players are ready', () => {
      // TODO
    });
    test('if the player is already ready, nothing changes', () => {
      // TODO
    });
    test('The first game phase after starting is picking a word', () => {
      // TODO
    });
    test('if there are an even number of players, players draw their own word', () => {
      // TODO
    });
    test('if there are an even number of players, players do not draw their own word', () => {
      // TODO
    });
  });

  describe('ApplyMove', () => {
    it('should rotate drawings and guesses in the correct order', () => {
      // TODO
    });
    it('should end the game when a player receives a guess or drawing in their own chain', () => {
      // TODO
    });
    it('alternates between drawing and guessing', () => {
      // TODO
    });
    it('properly stores chains of drawings and guesses', () => {
      // TODO
    });
  });
});
