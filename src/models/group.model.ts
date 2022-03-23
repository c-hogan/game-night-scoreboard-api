export enum GroupPrivacyType {
  Public = 'public',
  Private = 'private'
}

interface GroupSettings {

  privacyType: GroupPrivacyType;

}

export default interface Group {

  id: string;

  name: string;

  settings: GroupSettings

}
