import DbItem from "./db-item";

export default interface PlayLogEntry extends DbItem {

  groupId: string;

  gameId: string;

  playerIds: string[];

  winnerIds: string[];

  date: string; // ISO-8601 YYYY-MM-DDThh:mm:ss.sZ

  notes: string;

}
