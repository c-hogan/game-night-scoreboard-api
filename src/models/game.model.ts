export enum GameType {
  BoardGame = 'boardgame',
  VideoGame = 'videogame',
  CardGame = 'cardgame',
  Other = 'other'
}

export default interface Game {

  id: string;

  name: string;

  type: GameType;

  categories: string[];

  thumbnail: string;

};
