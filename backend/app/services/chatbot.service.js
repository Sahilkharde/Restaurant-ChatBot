const { getRestaurantById, getAllRestaurants } = require('../data/restaurants');
const { saveOrder, saveBooking } = require('../data/mockStorage');

const STATES = {
    INIT: 'INIT',
    RESTAURANT_SELECT: 'RESTAURANT_SELECT',
    COLLECT_NAME: 'COLLECT_NAME',
    COLLECT_PHONE: 'COLLECT_PHONE',
    COLLECT_EMAIL: 'COLLECT_EMAIL',
    MAIN_MENU: 'MAIN_MENU',
    MENU_CATEGORIES: 'MENU_CATEGORIES',
    MENU_ITEMS: 'MENU_ITEMS',
    ORDER_BROWSE: 'ORDER_BROWSE',
    CART_REVIEW: 'CART_REVIEW',
    ORDER_CONFIRM: 'ORDER_CONFIRM',
    BOOK_DATE: 'BOOK_DATE',
    BOOK_TIME: 'BOOK_TIME',
    BOOK_PARTY: 'BOOK_PARTY',
    BOOKING_CONFIRM: 'BOOKING_CONFIRM',
    CONFIRMATION: 'CONFIRMATION',
    COMING_SOON: 'COMING_SOON',
};

/**
 * Core state machine.
 * @param {object} params
 * @param {string} params.message  - Raw user input text
 * @param {string} params.state    - Current FSM state
 * @param {string|null} params.restaurantId
 * @param {object} params.session  - { name, phone, email, selectedCategory, pendingOrder, pendingBooking }
 * @param {Array}  params.cart     - [{ id, name, price, emoji, qty }]
 * @returns {{ reply: string, nextState: string, ui: { type: string, data: object }|null, session: object, cart: Array }}
 */
function processMessage({ message, state, restaurantId, session = {}, cart = [] }) {
    const msg = (message || '').trim().toLowerCase();
    const restaurant = restaurantId ? getRestaurantById(restaurantId) : null;

    switch (state) {

        // ── INIT ──────────────────────────────────────────────────────────────
        case STATES.INIT: {
            const isReset = msg === '__reset__';
            if (msg === 'restaurant' || msg.includes('restaurant')) {
                return {
                    reply: 'Great choice! Here are our featured Canadian restaurants. Pick one to get started:',
                    nextState: STATES.RESTAURANT_SELECT,
                    ui: { type: 'restaurant_cards', data: { restaurants: getAllRestaurants() } },
                    session: {},
                    cart: [],
                };
            }
            if (msg === 'salon' || msg === 'grocery') {
                return {
                    reply: `${capitalise(msg)} is coming soon! For now, choose **Restaurant** to explore our dining options.`,
                    nextState: STATES.INIT,
                    ui: { type: 'business_cards', data: {} },
                    session: {},
                    cart: [],
                };
            }
            return {
                reply: isReset
                    ? 'Chat reset! Welcome to DineBot 🍽️ What type of business are you looking for?'
                    : 'Welcome to DineBot 🍽️ What type of business are you looking for?',
                nextState: STATES.INIT,
                ui: { type: 'business_cards', data: {} },
                session: {},
                cart: [],
            };
        }

        // ── RESTAURANT_SELECT ─────────────────────────────────────────────────
        case STATES.RESTAURANT_SELECT: {
            const r = getRestaurantById(message);
            if (!r) {
                return {
                    reply: 'Please select one of the restaurants shown above.',
                    nextState: STATES.RESTAURANT_SELECT,
                    ui: { type: 'restaurant_cards', data: { restaurants: getAllRestaurants() } },
                    session,
                    cart,
                };
            }
            return {
                reply: `${r.emoji} Great pick! Welcome to **${r.name}** in ${r.city}.\n\nLet's set you up. First, what's your **name**?`,
                nextState: STATES.COLLECT_NAME,
                ui: { type: 'form_step', data: { step: 1, label: 'Your Name', placeholder: 'e.g. Jane Doe', total: 3 } },
                session: { restaurantName: r.name },
                cart: [],
            };
        }

        // ── COLLECT INFO ──────────────────────────────────────────────────────
        case STATES.COLLECT_NAME: {
            if (!msg) return { reply: 'Please enter your name to continue.', nextState: STATES.COLLECT_NAME, ui: { type: 'form_step', data: { step: 1, label: 'Your Name', placeholder: 'e.g. Jane Doe', total: 3 } }, session, cart };
            return {
                reply: `Nice to meet you, **${capitalise(message.trim())}**! 📱 What's your **phone number**?`,
                nextState: STATES.COLLECT_PHONE,
                ui: { type: 'form_step', data: { step: 2, label: 'Phone Number', placeholder: 'e.g. 416-555-0100', total: 3 } },
                session: { ...session, name: capitalise(message.trim()) },
                cart,
            };
        }

        case STATES.COLLECT_PHONE: {
            if (!msg) return { reply: 'Please enter a phone number.', nextState: STATES.COLLECT_PHONE, ui: { type: 'form_step', data: { step: 2, label: 'Phone Number', placeholder: 'e.g. 416-555-0100', total: 3 } }, session, cart };
            return {
                reply: `Got it! 📧 And your **email address**?`,
                nextState: STATES.COLLECT_EMAIL,
                ui: { type: 'form_step', data: { step: 3, label: 'Email Address', placeholder: 'e.g. jane@email.com', total: 3 } },
                session: { ...session, phone: message.trim() },
                cart,
            };
        }

        case STATES.COLLECT_EMAIL: {
            if (!msg) return { reply: 'Please enter your email address.', nextState: STATES.COLLECT_EMAIL, ui: { type: 'form_step', data: { step: 3, label: 'Email Address', placeholder: 'e.g. jane@email.com', total: 3 } }, session, cart };
            const newSession = { ...session, email: message.trim() };
            return {
                reply: `Perfect, you're all set ${newSession.name}! 🎉\n\nWelcome to **${newSession.restaurantName}**. What would you like to do?`,
                nextState: STATES.MAIN_MENU,
                ui: { type: 'main_menu', data: {} },
                session: newSession,
                cart: [],
            };
        }

        // ── MAIN MENU ─────────────────────────────────────────────────────────
        case STATES.MAIN_MENU: {
            if (msg === 'view_menu' || msg.includes('view menu') || msg.includes('menu')) {
                const categories = Object.keys(restaurant.menu);
                return {
                    reply: `Here's the **${restaurant.name}** menu. Select a category to explore:`,
                    nextState: STATES.MENU_CATEGORIES,
                    ui: { type: 'menu_grid', data: { restaurantId, categories, items: restaurant.menu } },
                    session,
                    cart,
                };
            }
            if (msg === 'order_food' || msg.includes('order') || msg.includes('food')) {
                const categories = Object.keys(restaurant.menu);
                return {
                    reply: `Let's build your order! 🛒 Browse the **${restaurant.name}** menu and add items to your cart:`,
                    nextState: STATES.ORDER_BROWSE,
                    ui: { type: 'menu_grid', data: { restaurantId, categories, items: restaurant.menu, ordering: true } },
                    session,
                    cart,
                };
            }
            if (msg === 'book_table' || msg.includes('book') || msg.includes('table') || msg.includes('reservation')) {
                const today = new Date().toISOString().split('T')[0];
                const availableDates = Object.keys(restaurant.tables).slice(0, 7);
                return {
                    reply: `📅 Let's book a table at **${restaurant.name}**. Select your preferred date:`,
                    nextState: STATES.BOOK_DATE,
                    ui: { type: 'date_picker', data: { availableDates } },
                    session,
                    cart,
                };
            }
            return {
                reply: `What would you like to do at **${restaurant ? restaurant.name : 'the restaurant'}**?`,
                nextState: STATES.MAIN_MENU,
                ui: { type: 'main_menu', data: {} },
                session,
                cart,
            };
        }

        // ── MENU BROWSE ───────────────────────────────────────────────────────
        case STATES.MENU_CATEGORIES: {
            return {
                reply: `Here's the full menu. Select a category to browse:`,
                nextState: STATES.MENU_CATEGORIES,
                ui: { type: 'menu_grid', data: { restaurantId, categories: Object.keys(restaurant.menu), items: restaurant.menu } },
                session,
                cart,
            };
        }

        case STATES.MENU_ITEMS: {
            return {
                reply: `Anything else you'd like to see? Choose another category or go back to the main menu.`,
                nextState: STATES.MAIN_MENU,
                ui: { type: 'main_menu', data: {} },
                session,
                cart,
            };
        }

        // ── ORDERING ──────────────────────────────────────────────────────────
        case STATES.ORDER_BROWSE: {
            if (msg === 'view_cart' || msg === 'checkout') {
                if (!cart || cart.length === 0) {
                    return {
                        reply: 'Your cart is empty. Add some items first!',
                        nextState: STATES.ORDER_BROWSE,
                        ui: { type: 'menu_grid', data: { restaurantId, categories: Object.keys(restaurant.menu), items: restaurant.menu, ordering: true } },
                        session,
                        cart,
                    };
                }
                const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
                return {
                    reply: `Here's your cart. Ready to place your order?`,
                    nextState: STATES.CART_REVIEW,
                    ui: { type: 'cart_review', data: { cart, total: total.toFixed(2), restaurantName: restaurant.name } },
                    session,
                    cart,
                };
            }
            const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
            return {
                reply: `Item added to cart! 🛒 You have **${cart.length} item(s)** — Total: **$${total.toFixed(2)}**\n\nKeep browsing or tap **View Cart** to checkout.`,
                nextState: STATES.ORDER_BROWSE,
                ui: { type: 'menu_grid', data: { restaurantId, categories: Object.keys(restaurant.menu), items: restaurant.menu, ordering: true } },
                session,
                cart,
            };
        }

        case STATES.CART_REVIEW: {
            if (msg === 'confirm_order' || msg.includes('confirm') || msg.includes('place order')) {
                const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
                const order = saveOrder({
                    restaurantId,
                    restaurantName: restaurant.name,
                    customer: session,
                    items: cart,
                    total: total.toFixed(2),
                });
                return {
                    reply: `🎉 Order confirmed! Your food is being prepared.`,
                    nextState: STATES.CONFIRMATION,
                    ui: { type: 'order_summary', data: { type: 'order', id: order.id, restaurantName: restaurant.name, restaurantColor: restaurant.color, items: cart, total: total.toFixed(2), customer: session } },
                    session,
                    cart: [],
                };
            }
            const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
            return {
                reply: `Here's your cart. Ready to place your order?`,
                nextState: STATES.CART_REVIEW,
                ui: { type: 'cart_review', data: { cart, total: total.toFixed(2), restaurantName: restaurant.name } },
                session,
                cart,
            };
        }

        // ── TABLE BOOKING ─────────────────────────────────────────────────────
        case STATES.BOOK_DATE: {
            const slots = restaurant.tables[message];
            if (!slots) {
                const availableDates = Object.keys(restaurant.tables).slice(0, 7);
                return {
                    reply: 'Please select a valid date from the options shown.',
                    nextState: STATES.BOOK_DATE,
                    ui: { type: 'date_picker', data: { availableDates } },
                    session,
                    cart,
                };
            }
            return {
                reply: `📅 **${formatDate(message)}** — Select a time slot:`,
                nextState: STATES.BOOK_TIME,
                ui: { type: 'time_slots', data: { date: message, slots } },
                session: { ...session, bookingDate: message },
                cart,
            };
        }

        case STATES.BOOK_TIME: {
            const dateSlots = restaurant.tables[session.bookingDate] || [];
            const slot = dateSlots.find(s => s.time === message);
            if (!slot || slot.available === 0) {
                return {
                    reply: 'That time slot is unavailable. Please choose another:',
                    nextState: STATES.BOOK_TIME,
                    ui: { type: 'time_slots', data: { date: session.bookingDate, slots: dateSlots } },
                    session,
                    cart,
                };
            }
            return {
                reply: `🕐 **${message}** selected. How many people in your party? (max ${slot.capacity})`,
                nextState: STATES.BOOK_PARTY,
                ui: { type: 'party_size', data: { max: slot.capacity } },
                session: { ...session, bookingTime: message },
                cart,
            };
        }

        case STATES.BOOK_PARTY: {
            const size = parseInt(message, 10);
            if (!size || size < 1 || size > 20) {
                return {
                    reply: 'Please select a valid party size.',
                    nextState: STATES.BOOK_PARTY,
                    ui: { type: 'party_size', data: { max: 6 } },
                    session,
                    cart,
                };
            }
            return {
                reply: `Almost done! Confirm your reservation:\n\n🍽️ **${restaurant.name}**\n📅 ${formatDate(session.bookingDate)}\n🕐 ${session.bookingTime}\n👥 Party of **${size}**`,
                nextState: STATES.BOOKING_CONFIRM,
                ui: { type: 'booking_confirm', data: { restaurantName: restaurant.name, date: session.bookingDate, time: session.bookingTime, partySize: size } },
                session: { ...session, partySize: size },
                cart,
            };
        }

        case STATES.BOOKING_CONFIRM: {
            if (msg === 'confirm_booking' || msg.includes('confirm')) {
                const booking = saveBooking({
                    restaurantId,
                    restaurantName: restaurant.name,
                    customer: session,
                    date: session.bookingDate,
                    time: session.bookingTime,
                    partySize: session.partySize,
                });
                return {
                    reply: `🎉 Your table is booked!`,
                    nextState: STATES.CONFIRMATION,
                    ui: { type: 'order_summary', data: { type: 'booking', id: booking.id, restaurantName: restaurant.name, restaurantColor: restaurant.color, date: session.bookingDate, time: session.bookingTime, partySize: session.partySize, customer: session } },
                    session,
                    cart,
                };
            }
            const availableDates = Object.keys(restaurant.tables).slice(0, 7);
            return {
                reply: 'No problem! Let\'s start over. Pick a new date:',
                nextState: STATES.BOOK_DATE,
                ui: { type: 'date_picker', data: { availableDates } },
                session: { ...session, bookingDate: undefined, bookingTime: undefined, partySize: undefined },
                cart,
            };
        }

        // ── CONFIRMATION ──────────────────────────────────────────────────────
        case STATES.CONFIRMATION: {
            return {
                reply: `What else can I help you with at **${restaurant ? restaurant.name : 'the restaurant'}**?`,
                nextState: STATES.MAIN_MENU,
                ui: { type: 'main_menu', data: {} },
                session,
                cart: [],
            };
        }

        // ── FALLBACK ──────────────────────────────────────────────────────────
        default:
            return {
                reply: 'Welcome to DineBot 🍽️ What type of business are you looking for?',
                nextState: STATES.INIT,
                ui: { type: 'business_cards', data: {} },
                session: {},
                cart: [],
            };
    }
}

function capitalise(str) {
    return str.replace(/\b\w/g, c => c.toUpperCase());
}

function formatDate(dateStr) {
    const d = new Date(dateStr + 'T12:00:00');
    return d.toLocaleDateString('en-CA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

module.exports = { processMessage, STATES };
