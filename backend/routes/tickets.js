const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticketController');

// Get all tickets
router.get('/', ticketController.getAllTickets);

// Create a new ticket
router.post('/', ticketController.createTicket);

// Assign an agent to a ticket
router.put('/:id/assign', ticketController.assignAgent);

// Update ticket status or other details
router.put('/:id', ticketController.updateTicket);

// Delete a ticket
router.delete('/:id', ticketController.deleteTicket);

module.exports = router;
