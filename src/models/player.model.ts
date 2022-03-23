export enum AvatarType {
  Initials = 'initials',
  Icon = 'icon',
  Image = 'image'
}

interface PlayerAvatar {

  type: AvatarType;

  src: string;

}

export default interface Player {

  id: string;

  username: string;

  name: string;

  avatar: PlayerAvatar;

  groups: string[];

};
