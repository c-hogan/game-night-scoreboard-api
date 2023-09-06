interface DbKey {
    pk: string;
    sk: string;
}

interface DbItem extends DbKey {
    id: string;
    createdDate: string; // ISO-8601 YYYY-MM-DDThh:mm:ss.sZ
    createdBy: string;
    lastUpdatedDate: string; // ISO-8601 YYYY-MM-DDThh:mm:ss.sZ
    lastUpdatedBy: string;
}

interface GroupSettings {
    privacyType: 'public' | 'private';
    administratorIds: string[];
    viewerIds: string[];
}

interface GroupMetadata extends DbItem {
    name: string;
    settings: GroupSettings;
    players: Player[];
}

interface Player {
    id: string;
    name: string;
}

interface PlayLogEntry extends DbItem {
    groupId: string;
    gameId: string;
    playerIds: string[];
    winnerIds: string[];
    date: string; // ISO-8601 YYYY-MM-DDThh:mm:ss.sZ
    notes: string;
}
