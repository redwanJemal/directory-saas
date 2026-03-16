import { type ComponentProps } from 'react';
import { Ionicons } from '@expo/vector-icons';

type IconName = ComponentProps<typeof Ionicons>['name'];

export const categoryIcons: Record<string, IconName> = {
  photography: 'camera-outline',
  catering: 'restaurant-outline',
  music: 'musical-notes-outline',
  venue: 'business-outline',
  decoration: 'flower-outline',
  cake: 'cafe-outline',
  makeup: 'color-palette-outline',
  transportation: 'car-outline',
  invitation: 'mail-outline',
  planning: 'clipboard-outline',
  florist: 'flower-outline',
  entertainment: 'musical-notes-outline',
  jewelry: 'diamond-outline',
  attire: 'shirt-outline',
  videography: 'videocam-outline',
  stationery: 'document-outline',
  rental: 'cube-outline',
  beauty: 'sparkles-outline',
};

export function getCategoryIcon(category: string): IconName {
  return categoryIcons[category.toLowerCase()] || 'grid-outline';
}
