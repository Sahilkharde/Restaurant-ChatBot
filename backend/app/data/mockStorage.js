const orders = new Map();
const bookings = new Map();

function _generateId(prefix) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let id = prefix + '-';
    for (let i = 0; i < 8; i++) id += chars[Math.floor(Math.random() * chars.length)];
    return id;
}

function saveOrder({ restaurantId, restaurantName, customer, items, total }) {
    const id = _generateId('ORD');
    const order = {
        id,
        restaurantId,
        restaurantName,
        customer,
        items,
        total,
        status: 'received',
        createdAt: new Date().toISOString(),
    };
    orders.set(id, order);
    return order;
}

function saveBooking({ restaurantId, restaurantName, customer, date, time, partySize }) {
    const id = _generateId('BKG');
    const booking = {
        id,
        restaurantId,
        restaurantName,
        customer,
        date,
        time,
        partySize,
        status: 'confirmed',
        createdAt: new Date().toISOString(),
    };
    bookings.set(id, booking);
    return booking;
}

function getOrderById(id) { return orders.get(id) || null; }
function getBookingById(id) { return bookings.get(id) || null; }
function getAllOrders() { return Array.from(orders.values()); }
function getAllBookings() { return Array.from(bookings.values()); }

module.exports = { saveOrder, saveBooking, getOrderById, getBookingById, getAllOrders, getAllBookings };
