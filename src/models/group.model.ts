import DbItem from "./db-item";

export enum GroupPrivacyType {
  Public = 'public',
  Private = 'private'
}

interface GroupSettings {

  privacyType: GroupPrivacyType;

  administratorIds: string[];

}

export default interface Group extends DbItem {

  name: string;

  settings: GroupSettings;

}
