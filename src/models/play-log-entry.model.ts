export default interface PlayLogEntry {

  id: string;

  groupId: string;

  gameId: string;

  playerIds: string[];

  winnerIds: string[];

  date: Date;

  notes: string;

  createdDate: Date;

  createdById: string;

  lastUpdatedDate: Date;

  lastUpdatedById: string;

}
