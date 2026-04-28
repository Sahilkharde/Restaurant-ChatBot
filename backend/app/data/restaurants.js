const restaurants = [
    {
        id: 'keg',
        name: 'The Keg Steakhouse',
        cuisine: 'Canadian Steakhouse',
        city: 'Toronto, ON',
        rating: 4.7,
        color: '#8B1A1A',
        emoji: '🥩',
        description: 'Premium steaks and warm hospitality since 1971.',
        menu: {
            Starters: [
                { id: 'k_s1', name: 'Shrimp Cocktail', description: 'Chilled jumbo shrimp with zesty cocktail sauce', price: 18.99, emoji: '🍤' },
                { id: 'k_s2', name: 'Escargot', description: 'Classic garlic butter escargot with toasted crostini', price: 16.99, emoji: '🐌' },
                { id: 'k_s3', name: 'Baked Brie', description: 'Warm brie with cranberry compote and crackers', price: 15.99, emoji: '🧀' },
            ],
            Mains: [
                { id: 'k_m1', name: 'Prime Rib', description: '16oz slow-roasted prime rib with au jus', price: 52.99, emoji: '🥩' },
                { id: 'k_m2', name: 'Filet Mignon', description: '8oz centre-cut tenderloin, perfectly seared', price: 58.99, emoji: '🍖' },
                { id: 'k_m3', name: 'Salmon', description: 'Atlantic salmon with lemon herb butter', price: 38.99, emoji: '🐟' },
                { id: 'k_m4', name: 'Chicken', description: 'Roasted half chicken with garlic mashed potato', price: 32.99, emoji: '🍗' },
            ],
            Desserts: [
                { id: 'k_d1', name: 'Carrot Cake', description: 'House-made carrot cake with cream cheese frosting', price: 12.99, emoji: '🎂' },
                { id: 'k_d2', name: 'Crème Brûlée', description: 'Classic vanilla bean custard with caramelized sugar', price: 11.99, emoji: '🍮' },
            ],
            Drinks: [
                { id: 'k_r1', name: 'Cabernet Sauvignon', description: 'Bold red wine — glass', price: 14.99, emoji: '🍷' },
                { id: 'k_r2', name: 'Old Fashioned', description: 'Bourbon, bitters, orange peel', price: 16.99, emoji: '🥃' },
                { id: 'k_r3', name: 'Sparkling Water', description: '750ml San Pellegrino', price: 6.99, emoji: '💧' },
            ],
        },
        tables: _generateSlots(),
    },
    {
        id: 'cactus',
        name: 'Cactus Club Cafe',
        cuisine: 'West Coast Modern',
        city: 'Vancouver, BC',
        rating: 4.5,
        color: '#2E7D32',
        emoji: '🌵',
        description: 'Fresh, West Coast inspired cuisine in a vibrant setting.',
        menu: {
            Starters: [
                { id: 'c_s1', name: 'Tuna Tataki', description: 'Seared albacore tuna with ponzu and crispy wontons', price: 21.99, emoji: '🐟' },
                { id: 'c_s2', name: 'Spinach Artichoke Dip', description: 'Warm dip with toasted pita and tortilla chips', price: 17.99, emoji: '🥗' },
                { id: 'c_s3', name: 'Calamari', description: 'Crispy calamari rings with chipotle aioli', price: 18.99, emoji: '🦑' },
            ],
            Mains: [
                { id: 'c_m1', name: 'Butternut Squash Ravioli', description: 'House-made ravioli with sage brown butter', price: 29.99, emoji: '🍝' },
                { id: 'c_m2', name: 'Halibut', description: 'Pan-seared BC halibut with mango salsa', price: 42.99, emoji: '🐠' },
                { id: 'c_m3', name: 'Burger', description: 'Signature beef burger with aged cheddar and truffle fries', price: 26.99, emoji: '🍔' },
                { id: 'c_m4', name: 'Bang Bang Shrimp Bowl', description: 'Crispy shrimp over coconut rice with spicy sauce', price: 31.99, emoji: '🍤' },
            ],
            Desserts: [
                { id: 'c_d1', name: 'Brownie', description: 'Warm chocolate brownie with vanilla ice cream', price: 11.99, emoji: '🍫' },
                { id: 'c_d2', name: 'Cheesecake', description: 'New York cheesecake with berry coulis', price: 12.99, emoji: '🍰' },
            ],
            Drinks: [
                { id: 'c_r1', name: 'Aperol Spritz', description: 'Aperol, prosecco, soda water', price: 15.99, emoji: '🍊' },
                { id: 'c_r2', name: 'Craft IPA', description: 'Local BC craft beer', price: 9.99, emoji: '🍺' },
                { id: 'c_r3', name: 'Fresh Lemonade', description: 'House-squeezed with mint', price: 6.99, emoji: '🍋' },
            ],
        },
        tables: _generateSlots(),
    },
    {
        id: 'sthubert',
        name: 'St-Hubert',
        cuisine: 'Quebec Rotisserie',
        city: 'Montreal, QC',
        rating: 4.4,
        color: '#C62828',
        emoji: '🍗',
        description: 'Quebec\'s favourite rotisserie chicken since 1951.',
        menu: {
            Starters: [
                { id: 'h_s1', name: 'Poutine', description: 'Classic fries with cheese curds and St-Hubert gravy', price: 13.99, emoji: '🍟' },
                { id: 'h_s2', name: 'Chicken Soup', description: 'Traditional Québécois chicken broth with noodles', price: 9.99, emoji: '🍜' },
                { id: 'h_s3', name: 'Coleslaw', description: 'Creamy house-made coleslaw', price: 5.99, emoji: '🥗' },
            ],
            Mains: [
                { id: 'h_m1', name: 'Quarter Chicken', description: 'Rotisserie quarter with fries and coleslaw', price: 17.99, emoji: '🍗' },
                { id: 'h_m2', name: 'Half Chicken', description: 'Rotisserie half chicken with two sides', price: 24.99, emoji: '🍗' },
                { id: 'h_m3', name: 'Chicken Club Wrap', description: 'Grilled chicken with bacon, lettuce, tomato', price: 18.99, emoji: '🌯' },
                { id: 'h_m4', name: 'Ribs & Chicken Combo', description: 'BBQ ribs + quarter chicken with fries', price: 31.99, emoji: '🍖' },
            ],
            Desserts: [
                { id: 'h_d1', name: 'Sugar Pie', description: 'Traditional Québécois tarte au sucre', price: 8.99, emoji: '🥧' },
                { id: 'h_d2', name: 'Chocolate Mousse', description: 'Rich dark chocolate mousse', price: 9.99, emoji: '🍫' },
            ],
            Drinks: [
                { id: 'h_r1', name: 'Pepsi', description: '591ml bottle', price: 3.99, emoji: '🥤' },
                { id: 'h_r2', name: 'Orange Juice', description: 'Fresh-squeezed orange juice', price: 5.99, emoji: '🍊' },
                { id: 'h_r3', name: 'Molson Canadian', description: 'Classic Canadian lager', price: 8.99, emoji: '🍺' },
            ],
        },
        tables: _generateSlots(),
    },
    {
        id: 'joey',
        name: 'Joey Restaurants',
        cuisine: 'Contemporary Casual',
        city: 'Calgary, AB',
        rating: 4.6,
        color: '#1565C0',
        emoji: '🍽️',
        description: 'Globally inspired dishes in a stylish, energetic atmosphere.',
        menu: {
            Starters: [
                { id: 'j_s1', name: 'Truffle Fries', description: 'Hand-cut fries with truffle oil, parmesan, and herbs', price: 14.99, emoji: '🍟' },
                { id: 'j_s2', name: 'Edamame Gyoza', description: 'Pan-fried dumplings with yuzu soy dipping sauce', price: 16.99, emoji: '🥟' },
                { id: 'j_s3', name: 'Bruschetta', description: 'Grilled baguette with heirloom tomatoes and basil', price: 13.99, emoji: '🍞' },
            ],
            Mains: [
                { id: 'j_m1', name: 'Korean BBQ Bowl', description: 'Bulgogi beef over jasmine rice with kimchi slaw', price: 27.99, emoji: '🍱' },
                { id: 'j_m2', name: 'Joey Burger', description: 'Double smashed patty with special sauce and fries', price: 25.99, emoji: '🍔' },
                { id: 'j_m3', name: 'Margherita Pizza', description: 'Wood-fired with San Marzano tomato and fresh mozzarella', price: 24.99, emoji: '🍕' },
                { id: 'j_m4', name: 'Grilled Salmon', description: 'Atlantic salmon with quinoa tabbouleh', price: 36.99, emoji: '🐟' },
            ],
            Desserts: [
                { id: 'j_d1', name: 'Sticky Toffee Pudding', description: 'Classic British pudding with toffee sauce and ice cream', price: 13.99, emoji: '🍮' },
                { id: 'j_d2', name: 'Mango Sorbet', description: 'Three scoops of fresh mango sorbet', price: 10.99, emoji: '🥭' },
            ],
            Drinks: [
                { id: 'j_r1', name: 'Espresso Martini', description: 'Vodka, espresso, coffee liqueur', price: 17.99, emoji: '☕' },
                { id: 'j_r2', name: 'Cucumber Cooler', description: 'Gin, cucumber, elderflower tonic', price: 15.99, emoji: '🥒' },
                { id: 'j_r3', name: 'Kombucha', description: 'House-brewed ginger lemon kombucha', price: 7.99, emoji: '🫙' },
            ],
        },
        tables: _generateSlots(),
    },
    {
        id: 'earls',
        name: 'Earls Kitchen + Bar',
        cuisine: 'Modern Casual',
        city: 'Winnipeg, MB',
        rating: 4.5,
        color: '#4A148C',
        emoji: '🥂',
        description: 'Bold flavours, handcrafted cocktails, and good times.',
        menu: {
            Starters: [
                { id: 'e_s1', name: 'Nachos', description: 'Loaded nachos with pulled pork, jalapeños, and sour cream', price: 19.99, emoji: '🧀' },
                { id: 'e_s2', name: 'Lemongrass Chicken Wings', description: 'Crispy wings tossed in lemongrass chili glaze', price: 18.99, emoji: '🍗' },
                { id: 'e_s3', name: 'French Onion Soup', description: 'Rich beef broth with gruyère crouton', price: 13.99, emoji: '🍵' },
            ],
            Mains: [
                { id: 'e_m1', name: 'Steak Frites', description: '10oz striploin with herb butter and frites', price: 44.99, emoji: '🥩' },
                { id: 'e_m2', name: 'Pad Thai', description: 'Classic Pad Thai with shrimp, tofu, and peanuts', price: 27.99, emoji: '🍜' },
                { id: 'e_m3', name: 'Veggie Bowl', description: 'Roasted vegetables over farro with tahini', price: 23.99, emoji: '🥗' },
                { id: 'e_m4', name: 'Fish Tacos', description: 'Three tacos with crispy fish, avocado, and pico de gallo', price: 26.99, emoji: '🌮' },
            ],
            Desserts: [
                { id: 'e_d1', name: 'Churros', description: 'Cinnamon churros with chocolate dipping sauce', price: 11.99, emoji: '🍩' },
                { id: 'e_d2', name: 'Lemon Tart', description: 'Silky lemon curd in a shortbread shell', price: 12.99, emoji: '🍋' },
            ],
            Drinks: [
                { id: 'e_r1', name: 'Peach Sangria', description: 'White wine, peach schnapps, fresh fruit', price: 14.99, emoji: '🍑' },
                { id: 'e_r2', name: 'Classic Caesar', description: 'Canada\'s favourite cocktail — vodka, Clamato, Tabasco', price: 13.99, emoji: '🍹' },
                { id: 'e_r3', name: 'Virgin Mojito', description: 'Lime, mint, soda water', price: 7.99, emoji: '🌿' },
            ],
        },
        tables: _generateSlots(),
    },
];

function _generateSlots() {
    const slots = {};
    const times = ['12:00 PM', '12:30 PM', '1:00 PM', '1:30 PM', '5:00 PM', '5:30 PM', '6:00 PM', '6:30 PM', '7:00 PM', '7:30 PM', '8:00 PM', '8:30 PM'];
    for (let d = 0; d < 7; d++) {
        const date = new Date();
        date.setDate(date.getDate() + d);
        const key = date.toISOString().split('T')[0];
        slots[key] = times.map(time => ({
            time,
            capacity: 6,
            available: Math.floor(Math.random() * 4) + 1,
        }));
    }
    return slots;
}

function getRestaurantById(id) {
    return restaurants.find(r => r.id === id) || null;
}

function getAllRestaurants() {
    return restaurants.map(({ id, name, cuisine, city, rating, color, emoji, description }) =>
        ({ id, name, cuisine, city, rating, color, emoji, description }));
}

module.exports = { restaurants, getRestaurantById, getAllRestaurants };
