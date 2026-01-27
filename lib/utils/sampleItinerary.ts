import type { GeneratedItinerary, PlanPreferences } from '../types/itinerary';

const timeSlots = [
  { time: '9:00 AM', emoji: '☕', label: 'Morning Coffee' },
  { time: '10:30 AM', emoji: '⛩️', label: 'Morning Activity' },
  { time: '12:30 PM', emoji: '🍜', label: 'Lunch' },
  { time: '2:30 PM', emoji: '🛍️', label: 'Afternoon Activity' },
  { time: '5:00 PM', emoji: '🍵', label: 'Afternoon Break' },
  { time: '7:00 PM', emoji: '🍽️', label: 'Dinner' },
];

const defaultActivities = {
  coffee: [
    { title: 'Local Coffee Shop', details: 'Start your day with artisan coffee and pastries at a cozy neighborhood café.', rating: '4.5', price: '$$' },
    { title: 'Specialty Roasters', details: 'Award-winning single-origin coffees in a minimalist setting.', rating: '4.7', price: '$$' },
    { title: 'Historic Café', details: 'A beloved institution serving traditional coffee since the 1950s.', rating: '4.4', price: '$' },
  ],
  cultural: [
    { title: 'Historic Temple', details: 'Explore ancient architecture and peaceful gardens at this UNESCO site.', rating: '4.8', price: '$' },
    { title: 'National Museum', details: 'World-class collection showcasing local history and art.', rating: '4.6', price: '$$' },
    { title: 'Traditional Garden', details: 'Meticulously landscaped gardens perfect for contemplative walks.', rating: '4.5', price: '$' },
    { title: 'Old Town District', details: 'Wander through charming streets with traditional architecture.', rating: '4.4', price: 'Free' },
  ],
  lunch: [
    { title: 'Local Favorite Restaurant', details: 'Authentic regional cuisine beloved by locals for generations.', rating: '4.6', price: '$$' },
    { title: 'Street Food Market', details: 'Vibrant market with dozens of food stalls offering local specialties.', rating: '4.5', price: '$' },
    { title: 'Traditional Restaurant', details: 'Classic dishes prepared using time-honored recipes.', rating: '4.4', price: '$$' },
  ],
  shopping: [
    { title: 'Main Shopping District', details: 'Browse boutiques, department stores, and local artisan shops.', rating: '4.3', price: 'Varies' },
    { title: 'Local Market', details: 'Find unique souvenirs, crafts, and local products.', rating: '4.5', price: '$' },
    { title: 'Artisan Quarter', details: 'Small workshops and galleries featuring local craftspeople.', rating: '4.6', price: '$$' },
  ],
  afternoon: [
    { title: 'Scenic Viewpoint', details: 'Panoramic views of the city from this popular lookout spot.', rating: '4.7', price: 'Free' },
    { title: 'Local Tea House', details: 'Relax with traditional tea service in an authentic setting.', rating: '4.5', price: '$' },
    { title: 'Neighborhood Walk', details: 'Explore a charming residential area with local character.', rating: '4.3', price: 'Free' },
  ],
  dinner: [
    { title: 'Fine Dining Restaurant', details: 'Elevated local cuisine with impeccable service and atmosphere.', rating: '4.8', price: '$$$' },
    { title: 'Popular Local Eatery', details: 'Where the locals go for hearty, delicious meals.', rating: '4.5', price: '$$' },
    { title: 'Trendy New Restaurant', details: 'Modern takes on classic dishes in a stylish setting.', rating: '4.6', price: '$$$' },
  ],
};

const dayThemes = [
  { title: 'City Center Exploration', description: 'Discover the heart of the city with its main attractions and bustling streets.' },
  { title: 'Cultural Immersion', description: 'Dive deep into local history, art, and traditions.' },
  { title: 'Local Neighborhoods', description: 'Explore charming districts away from the tourist crowds.' },
  { title: 'Food & Markets', description: 'A culinary journey through the best local flavors.' },
  { title: 'Nature & Relaxation', description: 'Parks, gardens, and peaceful spots to recharge.' },
  { title: 'Shopping & Entertainment', description: 'Retail therapy and local entertainment options.' },
  { title: 'Hidden Gems', description: 'Off-the-beaten-path discoveries and local secrets.' },
];

function getRandomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function generateSampleItinerary(
  destination: string,
  numDays: number,
  preferences?: PlanPreferences
): GeneratedItinerary {
  const days: GeneratedItinerary['days'] = [];
  const locations: GeneratedItinerary['locations'] = [];

  // Base coordinates (will be approximate for the destination)
  const baseLat = 35.6762 + (Math.random() - 0.5) * 10;
  const baseLng = 139.6503 + (Math.random() - 0.5) * 10;

  for (let dayNum = 1; dayNum <= numDays; dayNum++) {
    const theme = dayThemes[(dayNum - 1) % dayThemes.length];
    const activities: GeneratedItinerary['days'][0]['activities'] = [];
    const alternatives: GeneratedItinerary['days'][0]['alternatives'] = [];

    // Generate main activities for each time slot
    timeSlots.forEach((slot, index) => {
      let category: keyof typeof defaultActivities;
      if (slot.label.includes('Coffee')) category = 'coffee';
      else if (slot.label.includes('Morning Activity')) category = 'cultural';
      else if (slot.label.includes('Lunch')) category = 'lunch';
      else if (slot.label.includes('Afternoon Activity')) category = 'shopping';
      else if (slot.label.includes('Break')) category = 'afternoon';
      else category = 'dinner';

      const activity = getRandomItem(defaultActivities[category]);
      const activityTitle = `${activity.title} - ${destination}`;

      activities.push({
        type: 'main' as const,
        sortOrder: index,
        time: slot.time,
        emoji: slot.emoji,
        title: activityTitle,
        details: activity.details,
        rating: activity.rating,
        price: activity.price,
        mapUrl: `https://www.google.com/maps/search/${encodeURIComponent(activityTitle)}`,
      });

      // Add to locations
      locations.push({
        name: activityTitle,
        lat: baseLat + (Math.random() - 0.5) * 0.05,
        lng: baseLng + (Math.random() - 0.5) * 0.05,
        emoji: slot.emoji,
        color: slot.emoji === '☕' ? '#8B4513' :
               slot.emoji === '🍜' || slot.emoji === '🍽️' ? '#4CAF50' :
               slot.emoji === '⛩️' ? '#9C27B0' :
               slot.emoji === '🛍️' ? '#2196F3' : '#FF9800',
        category: category.charAt(0).toUpperCase() + category.slice(1),
        rating: activity.rating,
      });
    });

    // Generate 2-3 alternatives
    const altCategories: (keyof typeof defaultActivities)[] = ['coffee', 'lunch', 'dinner'];
    altCategories.forEach((cat, index) => {
      const alt = getRandomItem(defaultActivities[cat]);
      alternatives.push({
        type: 'alternative' as const,
        sortOrder: index,
        time: `${cat.charAt(0).toUpperCase() + cat.slice(1)} Alternative`,
        emoji: cat === 'coffee' ? '☕' : cat === 'lunch' ? '🍜' : '🍽️',
        title: `${alt.title} - ${destination}`,
        details: alt.details,
        rating: alt.rating,
        price: alt.price,
      });
    });

    days.push({
      dayNumber: dayNum,
      title: theme.title,
      description: theme.description,
      activities,
      alternatives,
    });
  }

  return { days, locations };
}
