const { processMessage } = require('../services/chatbot.service');
const { getAllOrders, getAllBookings, getOrderById, getBookingById } = require('../data/mockStorage');
const { v4: uuid } = require('uuid');

module.exports = function (app) {

    // ── Main chat endpoint ──────────────────────────────────────────────────
    app.post('/chat', function (req, res) {
        try {
            const {
                message = '',
                state = 'INIT',
                restaurantId = null,
                session = {},
                cart = [],
                conversationUniqueId,
            } = req.body;

            const convId = conversationUniqueId || uuid();

            const result = processMessage({ message, state, restaurantId, session, cart });

            return res.json({
                reply: result.reply,
                nextState: result.nextState,
                ui: result.ui || null,
                session: result.session,
                cart: result.cart,
                conversationUniqueId: convId,
            });
        } catch (err) {
            console.error('[DineBot] /chat error:', err.message);
            return res.status(500).json({ reply: 'Something went wrong. Please try again.', nextState: 'INIT', ui: { type: 'business_cards', data: {} }, session: {}, cart: [] });
        }
    });

    // ── Admin: list all orders ──────────────────────────────────────────────
    app.get('/admin/orders', function (req, res) {
        res.json(getAllOrders());
    });

    // ── Admin: get single order ─────────────────────────────────────────────
    app.get('/admin/orders/:id', function (req, res) {
        const order = getOrderById(req.params.id);
        if (!order) return res.status(404).json({ error: 'Order not found' });
        res.json(order);
    });

    // ── Admin: list all bookings ────────────────────────────────────────────
    app.get('/admin/bookings', function (req, res) {
        res.json(getAllBookings());
    });

    // ── Admin: get single booking ───────────────────────────────────────────
    app.get('/admin/bookings/:id', function (req, res) {
        const booking = getBookingById(req.params.id);
        if (!booking) return res.status(404).json({ error: 'Booking not found' });
        res.json(booking);
    });

};
