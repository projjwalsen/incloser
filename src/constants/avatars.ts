/**
 * Avatar list for profile selection
 * Using placeholder images for now - replace with actual avatar assets
 */

export interface Avatar {
  id: string;
  source: any; // ImageSourcePropType
  label?: string;
}

export const AVATARS: Avatar[] = [
  {
    id: "avatar_1",
    source: require("../../assets/images/male_profile.png"),
    label: "Avatar 1",
  },
  {
    id: "avatar_2",
    source: require("../../assets/images/M2.png"),
    label: "Avatar 2",
  },
  {
    id: "avatar_3",
    source: require("../../assets/images/M3.png"),
    label: "Avatar 3",
  },
  {
    id: "avatar_4",
    source: require("../../assets/images/M4.png"),
    label: "Avatar 4",
  },
  {
    id: "avatar_5",
    source: require("../../assets/images/M5.png"),
    label: "Avatar 5",
  },
  {
    id: "avatar_6",
    source: require("../../assets/images/M6.png"),
    label: "Avatar 6",
  },
  {
    id: "avatar_7",
    source: require("../../assets/images/M7.png"),
    label: "Avatar 7",
  },
  {
    id: "avatar_8",
    source: require("../../assets/images/M8.png"),
    label: "Avatar 8",
  },
];
