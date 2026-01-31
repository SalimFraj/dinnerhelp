import type { IngredientCategory, ShoppingCategory } from '../types';

// Comprehensive ingredient-to-category mapping database
const ingredientCategoryMap: Record<string, IngredientCategory> = {
    // Dairy
    milk: 'dairy',
    'whole milk': 'dairy',
    '2% milk': 'dairy',
    'skim milk': 'dairy',
    'almond milk': 'dairy',
    'oat milk': 'dairy',
    'soy milk': 'dairy',
    cheese: 'dairy',
    cheddar: 'dairy',
    mozzarella: 'dairy',
    parmesan: 'dairy',
    'cream cheese': 'dairy',
    feta: 'dairy',
    brie: 'dairy',
    gouda: 'dairy',
    swiss: 'dairy',
    butter: 'dairy',
    yogurt: 'dairy',
    'greek yogurt': 'dairy',
    cream: 'dairy',
    'heavy cream': 'dairy',
    'sour cream': 'dairy',
    'whipping cream': 'dairy',
    'half and half': 'dairy',
    eggs: 'dairy',
    egg: 'dairy',
    'cottage cheese': 'dairy',
    ricotta: 'dairy',

    // Produce - Vegetables
    lettuce: 'produce',
    spinach: 'produce',
    kale: 'produce',
    arugula: 'produce',
    cabbage: 'produce',
    broccoli: 'produce',
    cauliflower: 'produce',
    carrot: 'produce',
    carrots: 'produce',
    celery: 'produce',
    cucumber: 'produce',
    tomato: 'produce',
    tomatoes: 'produce',
    'cherry tomatoes': 'produce',
    onion: 'produce',
    onions: 'produce',
    'red onion': 'produce',
    'green onion': 'produce',
    scallion: 'produce',
    scallions: 'produce',
    garlic: 'produce',
    ginger: 'produce',
    potato: 'produce',
    potatoes: 'produce',
    'sweet potato': 'produce',
    'bell pepper': 'produce',
    'green pepper': 'produce',
    'red pepper': 'produce',
    jalapeno: 'produce',
    mushroom: 'produce',
    mushrooms: 'produce',
    zucchini: 'produce',
    squash: 'produce',
    eggplant: 'produce',
    asparagus: 'produce',
    'green beans': 'produce',
    peas: 'produce',
    corn: 'produce',
    avocado: 'produce',
    'brussels sprouts': 'produce',
    beet: 'produce',
    beets: 'produce',
    radish: 'produce',
    turnip: 'produce',

    // Produce - Fruits
    apple: 'produce',
    apples: 'produce',
    banana: 'produce',
    bananas: 'produce',
    orange: 'produce',
    oranges: 'produce',
    lemon: 'produce',
    lemons: 'produce',
    lime: 'produce',
    limes: 'produce',
    grape: 'produce',
    grapes: 'produce',
    strawberry: 'produce',
    strawberries: 'produce',
    blueberry: 'produce',
    blueberries: 'produce',
    raspberry: 'produce',
    raspberries: 'produce',
    blackberry: 'produce',
    blackberries: 'produce',
    mango: 'produce',
    pineapple: 'produce',
    watermelon: 'produce',
    cantaloupe: 'produce',
    peach: 'produce',
    peaches: 'produce',
    pear: 'produce',
    pears: 'produce',
    plum: 'produce',
    cherry: 'produce',
    cherries: 'produce',
    kiwi: 'produce',
    papaya: 'produce',
    coconut: 'produce',

    // Produce - Herbs
    basil: 'produce',
    parsley: 'produce',
    cilantro: 'produce',
    mint: 'produce',
    rosemary: 'produce',
    thyme: 'produce',
    oregano: 'produce',
    dill: 'produce',
    chives: 'produce',
    sage: 'produce',

    // Meat & Protein
    chicken: 'meat',
    'chicken breast': 'meat',
    'chicken thigh': 'meat',
    'chicken wings': 'meat',
    'ground chicken': 'meat',
    beef: 'meat',
    'ground beef': 'meat',
    steak: 'meat',
    'beef steak': 'meat',
    'ribeye': 'meat',
    'sirloin': 'meat',
    'filet mignon': 'meat',
    pork: 'meat',
    'pork chop': 'meat',
    'pork loin': 'meat',
    'ground pork': 'meat',
    bacon: 'meat',
    ham: 'meat',
    sausage: 'meat',
    turkey: 'meat',
    'ground turkey': 'meat',
    'turkey breast': 'meat',
    lamb: 'meat',
    'ground lamb': 'meat',
    duck: 'meat',
    veal: 'meat',
    fish: 'meat',
    salmon: 'meat',
    tuna: 'meat',
    shrimp: 'meat',
    crab: 'meat',
    lobster: 'meat',
    scallops: 'meat',
    cod: 'meat',
    tilapia: 'meat',
    halibut: 'meat',
    mahi: 'meat',
    trout: 'meat',
    sardines: 'meat',
    anchovies: 'meat',
    tofu: 'meat',
    tempeh: 'meat',

    // Grains & Bread
    rice: 'grains',
    'white rice': 'grains',
    'brown rice': 'grains',
    'jasmine rice': 'grains',
    'basmati rice': 'grains',
    pasta: 'grains',
    spaghetti: 'grains',
    penne: 'grains',
    fettuccine: 'grains',
    linguine: 'grains',
    macaroni: 'grains',
    lasagna: 'grains',
    noodles: 'grains',
    bread: 'grains',
    'white bread': 'grains',
    'wheat bread': 'grains',
    'sourdough': 'grains',
    bagel: 'grains',
    bagels: 'grains',
    tortilla: 'grains',
    tortillas: 'grains',
    'pita bread': 'grains',
    naan: 'grains',
    flour: 'grains',
    'all-purpose flour': 'grains',
    'bread flour': 'grains',
    'whole wheat flour': 'grains',
    oats: 'grains',
    oatmeal: 'grains',
    quinoa: 'grains',
    couscous: 'grains',
    barley: 'grains',
    bulgur: 'grains',
    cornmeal: 'grains',
    cereal: 'grains',
    crackers: 'grains',
    buns: 'grains',
    rolls: 'grains',
    croissant: 'grains',

    // Canned Goods
    'canned tomatoes': 'canned',
    'tomato sauce': 'canned',
    'tomato paste': 'canned',
    'diced tomatoes': 'canned',
    'crushed tomatoes': 'canned',
    'canned beans': 'canned',
    'black beans': 'canned',
    'kidney beans': 'canned',
    'chickpeas': 'canned',
    'garbanzo beans': 'canned',
    'pinto beans': 'canned',
    'cannellini beans': 'canned',
    'refried beans': 'canned',
    'canned corn': 'canned',
    'canned peas': 'canned',
    'canned tuna': 'canned',
    'canned salmon': 'canned',
    'chicken broth': 'canned',
    'beef broth': 'canned',
    'vegetable broth': 'canned',
    stock: 'canned',
    'coconut milk': 'canned',
    'evaporated milk': 'canned',
    'condensed milk': 'canned',
    soup: 'canned',

    // Frozen
    'frozen vegetables': 'frozen',
    'frozen peas': 'frozen',
    'frozen corn': 'frozen',
    'frozen broccoli': 'frozen',
    'frozen spinach': 'frozen',
    'frozen fruit': 'frozen',
    'frozen berries': 'frozen',
    'ice cream': 'frozen',
    'frozen pizza': 'frozen',
    'frozen fries': 'frozen',
    'french fries': 'frozen',
    'frozen waffles': 'frozen',
    'frozen fish': 'frozen',
    'frozen shrimp': 'frozen',
    'frozen chicken': 'frozen',

    // Spices
    salt: 'spices',
    pepper: 'spices',
    'black pepper': 'spices',
    paprika: 'spices',
    'smoked paprika': 'spices',
    cumin: 'spices',
    coriander: 'spices',
    cinnamon: 'spices',
    nutmeg: 'spices',
    'chili powder': 'spices',
    'cayenne pepper': 'spices',
    'red pepper flakes': 'spices',
    turmeric: 'spices',
    curry: 'spices',
    'curry powder': 'spices',
    'garam masala': 'spices',
    'italian seasoning': 'spices',
    'garlic powder': 'spices',
    'onion powder': 'spices',
    'bay leaves': 'spices',
    cloves: 'spices',
    allspice: 'spices',
    cardamom: 'spices',
    'vanilla extract': 'spices',
    vanilla: 'spices',

    // Condiments & Sauces
    ketchup: 'condiments',
    mustard: 'condiments',
    mayonnaise: 'condiments',
    mayo: 'condiments',
    'hot sauce': 'condiments',
    'soy sauce': 'condiments',
    'teriyaki sauce': 'condiments',
    'bbq sauce': 'condiments',
    'barbecue sauce': 'condiments',
    'worcestershire sauce': 'condiments',
    vinegar: 'condiments',
    'balsamic vinegar': 'condiments',
    'apple cider vinegar': 'condiments',
    'red wine vinegar': 'condiments',
    'olive oil': 'condiments',
    'vegetable oil': 'condiments',
    'coconut oil': 'condiments',
    'sesame oil': 'condiments',
    honey: 'condiments',
    'maple syrup': 'condiments',
    molasses: 'condiments',
    jam: 'condiments',
    jelly: 'condiments',
    'peanut butter': 'condiments',
    'almond butter': 'condiments',
    nutella: 'condiments',
    salsa: 'condiments',
    guacamole: 'condiments',
    hummus: 'condiments',
    relish: 'condiments',
    'ranch dressing': 'condiments',
    'caesar dressing': 'condiments',
    'italian dressing': 'condiments',

    // Beverages
    water: 'beverages',
    'sparkling water': 'beverages',
    juice: 'beverages',
    'orange juice': 'beverages',
    'apple juice': 'beverages',
    'cranberry juice': 'beverages',
    soda: 'beverages',
    cola: 'beverages',
    coffee: 'beverages',
    tea: 'beverages',
    'green tea': 'beverages',
    beer: 'beverages',
    wine: 'beverages',
    'red wine': 'beverages',
    'white wine': 'beverages',

    // Snacks
    chips: 'snacks',
    'potato chips': 'snacks',
    'tortilla chips': 'snacks',
    popcorn: 'snacks',
    pretzels: 'snacks',
    nuts: 'snacks',
    almonds: 'snacks',
    peanuts: 'snacks',
    walnuts: 'snacks',
    cashews: 'snacks',
    'trail mix': 'snacks',
    chocolate: 'snacks',
    candy: 'snacks',
    cookies: 'snacks',
    granola: 'snacks',
    'granola bar': 'snacks',

    // Baking
    sugar: 'grains',
    'brown sugar': 'grains',
    'powdered sugar': 'grains',
    'baking soda': 'grains',
    'baking powder': 'grains',
    yeast: 'grains',
    'chocolate chips': 'snacks',
    cocoa: 'grains',
    'cocoa powder': 'grains',
};

// Shopping category mapping (slightly different categories)
const shoppingCategoryMap: Record<string, ShoppingCategory> = {
    ...Object.fromEntries(
        Object.entries(ingredientCategoryMap).map(([key, value]) => {
            // Map ingredient categories to shopping categories
            const categoryMap: Record<IngredientCategory, ShoppingCategory> = {
                produce: 'produce',
                meat: 'meat',
                dairy: 'dairy',
                grains: 'bakery',
                canned: 'pantry',
                frozen: 'frozen',
                spices: 'pantry',
                condiments: 'pantry',
                beverages: 'beverages',
                snacks: 'pantry',
                other: 'other',
            };
            return [key, categoryMap[value]];
        })
    ),
    // Add household items
    'dish soap': 'household',
    'laundry detergent': 'household',
    'paper towels': 'household',
    'toilet paper': 'household',
    'trash bags': 'household',
    'aluminum foil': 'household',
    'plastic wrap': 'household',
    'ziplock bags': 'household',
    sponge: 'household',
    sponges: 'household',
    bleach: 'household',
    cleaner: 'household',
    soap: 'household',
    shampoo: 'household',
    toothpaste: 'household',
};

/**
 * Detect the category for an ingredient based on its name
 * Uses fuzzy matching to handle variations
 */
export function detectIngredientCategory(name: string): IngredientCategory {
    const normalized = name.toLowerCase().trim();

    // Exact match
    if (ingredientCategoryMap[normalized]) {
        return ingredientCategoryMap[normalized];
    }

    // Partial match - check if any key is contained in the name or vice versa
    for (const [key, category] of Object.entries(ingredientCategoryMap)) {
        if (normalized.includes(key) || key.includes(normalized)) {
            return category;
        }
    }

    // Word-based matching
    const words = normalized.split(/\s+/);
    for (const word of words) {
        if (ingredientCategoryMap[word]) {
            return ingredientCategoryMap[word];
        }
    }

    // Default to 'other' if no match found
    return 'other';
}

/**
 * Detect the category for a shopping item
 */
export function detectShoppingCategory(name: string): ShoppingCategory {
    const normalized = name.toLowerCase().trim();

    // Exact match
    if (shoppingCategoryMap[normalized]) {
        return shoppingCategoryMap[normalized];
    }

    // Partial match
    for (const [key, category] of Object.entries(shoppingCategoryMap)) {
        if (normalized.includes(key) || key.includes(normalized)) {
            return category;
        }
    }

    // Word-based matching
    const words = normalized.split(/\s+/);
    for (const word of words) {
        if (shoppingCategoryMap[word]) {
            return shoppingCategoryMap[word];
        }
    }

    return 'other';
}

/**
 * Suggest a default unit for an ingredient based on its category
 */
export function suggestUnit(name: string, category?: IngredientCategory): string {
    const cat = category || detectIngredientCategory(name);
    const normalized = name.toLowerCase();

    // Specific items with known units
    if (normalized.includes('egg')) return 'unit'; // carton/unit
    if (normalized.includes('milk') || normalized.includes('juice')) return 'gal';
    if (normalized.includes('broth') || normalized.includes('stock')) return 'carton';
    if (normalized.includes('flour') || normalized.includes('sugar') || normalized.includes('rice')) return 'bag';
    if (normalized.includes('bread')) return 'unit';
    if (normalized.includes('cereal') || normalized.includes('pasta')) return 'box';
    if (normalized.includes('butter')) return 'stick';
    if (normalized.includes('cheese')) return 'pack';
    if (normalized.includes('water') || normalized.includes('soda')) return 'pack';

    // Category-based defaults
    switch (cat) {
        case 'produce': return 'unit';
        case 'meat': return 'pack'; // Inventory focused
        case 'dairy': return 'unit';
        case 'grains': return 'box';
        case 'spices': return 'jar';
        case 'condiments': return 'bottle';
        case 'beverages': return 'bottle';
        case 'canned': return 'can';
        case 'frozen': return 'bag';
        case 'snacks': return 'box';
        default: return 'unit';
    }
}

/**
 * Get relevant units for a specific category (Inventory Focused)
 */
export function getUnitsForCategory(category: IngredientCategory): string[] {
    const standardUnits = ['unit', 'pack', 'box', 'bag', 'lb', 'kg'];

    switch (category) {
        case 'meat':
            return ['lb', 'kg', 'pack'];
        case 'produce':
            return ['unit', 'lb', 'kg', 'bag', 'bunch', 'head', 'pack'];
        case 'dairy':
            return ['gal', 'liter', 'carton', 'bottle', 'tub', 'stick', 'unit'];
        case 'beverages':
            return ['bottle', 'can', 'pack', 'liter', 'gal'];
        case 'canned':
            return ['can', 'jar', 'pack'];
        case 'grains':
            return ['bag', 'box', 'lb', 'kg', 'pack'];
        case 'spices':
            return ['jar', 'bottle', 'container', 'pack'];
        case 'condiments':
            return ['bottle', 'jar', 'tub', 'pack'];
        case 'frozen':
            return ['bag', 'box', 'pack'];
        case 'snacks':
            return ['bag', 'box', 'pack', 'bar'];
        default:
            return standardUnits;
    }
}
