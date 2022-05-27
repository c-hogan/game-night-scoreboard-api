import DbItem from "./db-item";

export enum AvatarType {
  Initials = 'initials',
  Icon = 'icon',
  Image = 'image'
}

interface PlayerAvatar {

  type: AvatarType;

  src: string;

}

export default interface Player extends DbItem {

  user: string;

  name: string;

  avatar: PlayerAvatar;

  groups: string[];

}
