export type StyleCategory = 'girls' | 'boys' | 'unisex'

export interface PortraitStyle {
  id: string
  name: string
  description: string
  category: StyleCategory
  price: number // in cents
  previewImage: string
  promptTemplate: string
}

export const PORTRAIT_STYLES: PortraitStyle[] = [
  // Girls styles
  {
    id: 'princess',
    name: 'Princess',
    description: 'A magical princess portrait with elegant crown and royal attire',
    category: 'girls',
    price: 1000,
    previewImage: '/styles/princess-preview.jpg',
    promptTemplate: 'Beautiful portrait of a young girl as an elegant princess, wearing a decorative crown and royal gown, fantasy style, soft lighting, magical atmosphere',
  },
  {
    id: 'fantasy-girl',
    name: 'Fantasy',
    description: 'Enchanting fantasy character portrait with magical elements',
    category: 'girls',
    price: 1000,
    previewImage: '/styles/fantasy-girl-preview.jpg',
    promptTemplate: 'Enchanting fantasy portrait of a young girl as a magical fairy creature, delicate wings, ethereal lighting, fantasy art style, dreamlike atmosphere',
  },
  // Boys styles
  {
    id: 'superheroes',
    name: 'Superheroes',
    description: 'Dynamic superhero portrait with action pose and cape',
    category: 'boys',
    price: 1000,
    previewImage: '/styles/superheroes-preview.jpg',
    promptTemplate: 'Dynamic superhero portrait of a young boy, heroic pose, colorful costume with cape, comic book style, action packed, bold colors',
  },
  {
    id: 'fantasy-boy',
    name: 'Fantasy',
    description: 'Epic fantasy warrior portrait with sword and shield',
    category: 'boys',
    price: 1000,
    previewImage: '/styles/fantasy-boy-preview.jpg',
    promptTemplate: 'Epic fantasy portrait of a young boy as a brave knight, wearing armor, holding sword and shield, fantasy art style, heroic lighting, epic atmosphere',
  },
  // Unisex styles
  {
    id: 'national-culture',
    name: 'National Culture',
    description: 'Traditional cultural attire portrait celebrating heritage',
    category: 'unisex',
    price: 1000,
    previewImage: '/styles/national-culture-preview.jpg',
    promptTemplate: 'Portrait celebrating cultural heritage, traditional national attire, elegant clothing representing cultural identity, artistic style, warm tones, dignified expression',
  },
  {
    id: 'preschool-graduation',
    name: 'Pre-school Graduation',
    description: 'Celebratory graduation portrait with cap and diploma',
    category: 'unisex',
    price: 1000,
    previewImage: '/styles/graduation-preview.jpg',
    promptTemplate: 'Joyful preschool graduation portrait, wearing graduation cap and gown, holding diploma, celebratory atmosphere, bright and cheerful, professional portrait style',
  },
]

export function getStyleById(id: string): PortraitStyle | undefined {
  return PORTRAIT_STYLES.find((style) => style.id === id)
}

export function getStylesByCategory(category: StyleCategory): PortraitStyle[] {
  return PORTRAIT_STYLES.filter((style) => style.category === category)
}
