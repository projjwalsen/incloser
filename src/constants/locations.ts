/**
 * Location data for profile creation
 */

export interface CityOption {
  id: string;
  name: string;
  state: string;
}

export interface StateOption {
  id: string;
  name: string;
}

export const STATES: StateOption[] = [
  { id: "west_bengal", name: "West Bengal" },
  { id: "maharashtra", name: "Maharashtra" },
  { id: "delhi", name: "Delhi" },
  { id: "karnataka", name: "Karnataka" },
  { id: "tamil_nadu", name: "Tamil Nadu" },
  { id: "kerala", name: "Kerala" },
  { id: "gujarat", name: "Gujarat" },
  { id: "rajasthan", name: "Rajasthan" },
  { id: "punjab", name: "Punjab" },
  { id: "haryana", name: "Haryana" },
];

export const CITIES: CityOption[] = [
  { id: "kolkata", name: "Kolkata", state: "west_bengal" },
  { id: "mumbai", name: "Mumbai", state: "maharashtra" },
  { id: "delhi", name: "Delhi", state: "delhi" },
  { id: "bangalore", name: "Bangalore", state: "karnataka" },
  { id: "chennai", name: "Chennai", state: "tamil_nadu" },
  { id: "kochi", name: "Kochi", state: "kerala" },
  { id: "ahmedabad", name: "Ahmedabad", state: "gujarat" },
  { id: "jaipur", name: "Jaipur", state: "rajasthan" },
  { id: "chandigarh", name: "Chandigarh", state: "punjab" },
  { id: "gurgaon", name: "Gurgaon", state: "haryana" },
];
