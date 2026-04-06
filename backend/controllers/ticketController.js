const Ticket = require('../models/Ticket');

// Helper to check escalation
const checkAndEscalate = async (tickets) => {
  const ONE_DAY = 24 * 60 * 60 * 1000;
  const now = new Date();
  
  let updated = false;
  
  for (let ticket of tickets) {
    if (ticket.status !== 'Resolved' && ticket.status !== 'Escalated') {
      const timeElapsed = now - new Date(ticket.createdAt);
      if (timeElapsed > ONE_DAY) {
        ticket.status = 'Escalated';
        await ticket.save();
        updated = true;
      }
    }
  }
  return updated;
};

exports.getAllTickets = async (req, res) => {
  try {
    const match = {};
    if (req.query.customer_name) {
      match.customer_name = req.query.customer_name;
    }

    let tickets = await Ticket.find(match).sort({ createdAt: -1 }); // Newest first
    
    // Check escalation
    const updated = await checkAndEscalate(tickets);
    if (updated) {
      // Re-fetch if updated
      tickets = await Ticket.find().sort({ createdAt: -1 });
    }
    
    res.status(200).json(tickets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createTicket = async (req, res) => {
  try {
    const { customer_name, subject, category, description, urgency } = req.body;
    
    // Validation is handled by Mongoose schema
    const newTicket = new Ticket({
      customer_name,
      subject,
      category,
      description,
      urgency,
      status: 'Open' // Default
    });

    const savedTicket = await newTicket.save();
    res.status(201).json(savedTicket);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.assignAgent = async (req, res) => {
  try {
    const { id } = req.params;
    const { agent_name } = req.body;

    const ticket = await Ticket.findById(id);
    if (!ticket) return res.status(404).json({ message: "Ticket not found" });

    if (ticket.status === 'Resolved') {
      return res.status(400).json({ message: "Cannot assign agent to a Resolved ticket. Ticket is locked." });
    }

    ticket.agent_assigned = agent_name;
    ticket.status = 'Assigned'; // Automatic status change
    
    const updatedTicket = await ticket.save();
    res.status(200).json(updatedTicket);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updateTicket = async (req, res) => {
  try {
    const { id } = req.params;
    
    const ticket = await Ticket.findById(id);
    if (!ticket) return res.status(404).json({ message: "Ticket not found" });

    // Locking mechanism
    if (ticket.status === 'Resolved') {
      return res.status(400).json({ message: "Cannot update a Resolved ticket. Ticket is locked." });
    }

    // Assign updates
    Object.assign(ticket, req.body);
    
    // Validate empty descriptions manually just in case, though mongoose will catch on save if it's strictly empty
    if (req.body.description !== undefined && req.body.description.trim() === '') {
       return res.status(400).json({ message: "Description cannot be empty" });
    }

    const updatedTicket = await ticket.save();
    res.status(200).json(updatedTicket);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Ticket.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: "Ticket not found" });
    res.status(200).json({ message: "Ticket deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
