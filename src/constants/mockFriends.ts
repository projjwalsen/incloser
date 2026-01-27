/**
 * Mock data for Male Home screens (Call/Chat/History)
 */

export type FriendStatus = "online" | "busy" | "offline";

export interface FriendItem {
  id: string;
  name: string;
  age: number;
  city: string;
  state: string;
  tags: string[]; // e.g., ["Friendship", "Marriage"]
  languages: string[]; // e.g., ["Bengali", "Hindi"]
  rating: number; // 1.0 to 5.0
  verified: boolean;
  status: FriendStatus;
  pricePerMin: number; // in rupees
  avatar: any; // require() image or placeholder
}

export interface HistoryItem {
  id: string;
  friend: FriendItem;
  time: string; // e.g., "6:10 pm"
  duration: string; // e.g., "2m 14s"
  type: "call" | "chat";
}

export interface HistorySection {
  dateLabel: string; // e.g., "Dec 14, 2025"
  data: HistoryItem[]; // Required by SectionList
}

// Mock Friends Data
export const MOCK_FRIENDS: FriendItem[] = [
  {
    id: "friend_1",
    name: "Ankita",
    age: 30,
    city: "Kolkata",
    state: "WB",
    tags: ["Friendship", "Marriage"],
    languages: ["Bengali", "Hindi"],
    rating: 4.4,
    verified: true,
    status: "online",
    pricePerMin: 2,
    avatar: require("../../assets/images/female_profile.png"),
  },
  {
    id: "friend_2",
    name: "Sraboni",
    age: 29,
    city: "Howrah",
    state: "WB",
    tags: ["Divorce", "Confidence"],
    languages: ["Bengali", "English"],
    rating: 4.5,
    verified: true,
    status: "online",
    pricePerMin: 2,
    avatar: require("../../assets/images/F2.png"),
  },
  {
    id: "friend_3",
    name: "Reshmi",
    age: 27,
    city: "Delhi",
    state: "Delhi",
    tags: ["Relationship", "Confidence"],
    languages: ["English", "Hindi"],
    rating: 4.2,
    verified: true,
    status: "online",
    pricePerMin: 2,
    avatar: require("../../assets/images/F3.png"),
  },
  {
    id: "friend_4",
    name: "Susmita",
    age: 28,
    city: "Kolkata",
    state: "WB",
    tags: ["Friendship", "Marriage"],
    languages: ["Bengali", "Hindi"],
    rating: 4.5,
    verified: true,
    status: "busy",
    pricePerMin: 2,
    avatar: require("../../assets/images/F4.png"),
  },
  {
    id: "friend_5",
    name: "Sunayana",
    age: 28,
    city: "Kolkata",
    state: "WB",
    tags: ["Friendship", "Marriage"],
    languages: ["Bengali", "Hindi"],
    rating: 4.5,
    verified: true,
    status: "online",
    pricePerMin: 2,
    avatar: require("../../assets/images/F5.png"),
  },
  {
    id: "friend_6",
    name: "Subhasree",
    age: 26,
    city: "Kolkata",
    state: "WB",
    tags: ["Friendship", "Marriage"],
    languages: ["Bengali", "Hindi"],
    rating: 4.5,
    verified: true,
    status: "busy",
    pricePerMin: 2,
    avatar: require("../../assets/images/F6.png"),
  },
  {
    id: "friend_7",
    name: "Rupsha",
    age: 20,
    city: "Kolkata",
    state: "WB",
    tags: ["Friendship", "Marriage"],
    languages: ["Bengali", "Hindi"],
    rating: 4.5,
    verified: true,
    status: "offline",
    pricePerMin: 2,
    avatar: require("../../assets/images/F7.png"),
  },
];

// Mock History Data grouped by date
export const MOCK_HISTORY: HistorySection[] = [
  {
    dateLabel: "Dec 14, 2025",
    data: [
      {
        id: "history_1",
        friend: MOCK_FRIENDS[4], // Sunayana
        time: "6:10 pm",
        duration: "2m 14s",
        type: "call",
      },
    ],
  },
  {
    dateLabel: "Dec 13, 2025",
    data: [
      {
        id: "history_2",
        friend: MOCK_FRIENDS[0], // Ankita
        time: "6:10 pm",
        duration: "2m 14s",
        type: "call",
      },
      {
        id: "history_3",
        friend: MOCK_FRIENDS[5], // Subhasree
        time: "6:10 pm",
        duration: "2m 14s",
        type: "call",
      },
    ],
  },
  {
    dateLabel: "Dec 12, 2025",
    data: [
      {
        id: "history_4",
        friend: MOCK_FRIENDS[6], // Rupsha
        time: "6:10 pm",
        duration: "2m 14s",
        type: "call",
      },
    ],
  },
];
