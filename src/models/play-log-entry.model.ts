import DbItem from "./db-item";

export default interface PlayLogEntry extends DbItem {

  groupId: string;

  gameId: string;

  playerIds: string[];

  winnerIds: string[];

  date: Date;

  notes: string;

}
