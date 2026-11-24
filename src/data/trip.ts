import type { LatLng } from '@/lib/geo';

export type Stop = {
  id: string;
  name: string;
  time: string;
  location: LatLng;
  short: string;
  story: string;
};

export type Trip = {
  id: string;
  title: string;
  stops: Stop[];
};

// Preset trip for the demo, a half day walk through Midtown starting in Koreatown
export const DEMO_TRIP: Trip = {
  id: 'midtown-half-day',
  title: 'Midtown half day',
  stops: [
    {
      id: 'koreatown',
      name: 'Koreatown lunch',
      time: '11:30 AM',
      location: { latitude: 40.7478, longitude: -73.987 },
      short: 'West 32nd Street between 5th Ave and Broadway',
      story:
        'This is Koreatown. The busiest block is West 32nd Street between Fifth Avenue and Broadway, sometimes called Korea Way. It is full of Korean restaurants, bakeries, cafes and karaoke rooms, and many places stay open late.',
    },
    {
      id: 'empire-state',
      name: 'Empire State Building',
      time: '12:45 PM',
      location: { latitude: 40.748817, longitude: -73.985428 },
      short: 'Observatory on the 86th floor',
      story:
        'This is the Empire State Building. It opened in 1931 and was the tallest building in the world for almost forty years. The open air observatory is on the 86th floor, and the entrance for visitors is on 34th Street.',
    },
    {
      id: 'nypl',
      name: 'New York Public Library',
      time: '2:00 PM',
      location: { latitude: 40.753182, longitude: -73.982253 },
      short: 'Main branch on 5th Ave',
      story:
        'This is the main branch of the New York Public Library. It opened in 1911. The two stone lions at the front steps are named Patience and Fortitude. Inside, the large reading room on the third floor is free to visit.',
    },
    {
      id: 'bryant-park',
      name: 'Bryant Park',
      time: '2:40 PM',
      location: { latitude: 40.753597, longitude: -73.983233 },
      short: 'Lawn and seating behind the library',
      story:
        'This is Bryant Park, right behind the library. There is a big lawn with free chairs and tables. In the colder months it has an ice skating rink and a holiday market.',
    },
    {
      id: 'times-square',
      name: 'Times Square',
      time: '3:30 PM',
      location: { latitude: 40.758, longitude: -73.9855 },
      short: 'Bright signs and Broadway theaters',
      story:
        'This is Times Square. It is named after The New York Times, which moved here in 1904. The famous New Year\'s Eve ball drop happens here, and most Broadway theaters are within a few blocks.',
    },
  ],
};

// Where the demo pretends the user is standing when they are far from New York
export const DEMO_SPOT: LatLng = { latitude: 40.74745, longitude: -73.98665 };
