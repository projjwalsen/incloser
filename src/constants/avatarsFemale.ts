/**
 * Female avatar list for profile selection
 */

export interface FemaleAvatar {
  id: string;
  source: any; // ImageSourcePropType
  label?: string;
}

export const FEMALE_AVATARS: FemaleAvatar[] = [
  {
    id: "female_avatar_1",
    source: require("../../assets/images/female_profile.png"),
    label: "Female Avatar 1",
  },
  {
    id: "female_avatar_2",
    source: require("../../assets/images/F2.png"),
    label: "Female Avatar 2",
  },
  {
    id: "female_avatar_3",
    source: require("../../assets/images/F3.png"),
    label: "Female Avatar 3",
  },
  {
    id: "female_avatar_4",
    source: require("../../assets/images/F4.png"),
    label: "Female Avatar 4",
  },
  {
    id: "female_avatar_5",
    source: require("../../assets/images/F5.png"),
    label: "Female Avatar 5",
  },
  {
    id: "female_avatar_6",
    source: require("../../assets/images/F6.png"),
    label: "Female Avatar 6",
  },
  {
    id: "female_avatar_7",
    source: require("../../assets/images/F7.png"),
    label: "Female Avatar 7",
  },
  {
    id: "female_avatar_8",
    source: require("../../assets/images/F8.png"),
    label: "Female Avatar 8",
  },
];
