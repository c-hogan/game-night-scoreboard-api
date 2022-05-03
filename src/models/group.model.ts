export enum GroupPrivacyType {
  Public = 'public',
  Private = 'private'
}

interface GroupSettings {

  privacyType: GroupPrivacyType;

  administratorIds: string[];

}

export default interface Group {

  id: string;

  name: string;

  settings: GroupSettings;

  createdDate: number;

  createdById: string;

  lastUpdatedDate: number;

  lastUpdatedById: string;
}
