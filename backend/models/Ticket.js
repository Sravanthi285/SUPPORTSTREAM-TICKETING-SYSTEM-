const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
  customer_name: {
    type: String,
    required: [true, 'Customer name is required']
  },
  subject: {
    type: String,
    required: [true, 'Subject is required']
  },
  category: {
    type: String,
    enum: ['Technical', 'Billing', 'General'],
    required: [true, 'Category is required (Technical, Billing, General)']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    minlength: [1, 'Description cannot be empty']
  },
  urgency: {
    type: String,
    enum: ['Low', 'Medium', 'High'],
    default: 'Low'
  },
  status: {
    type: String,
    enum: ['Open', 'In-Progress', 'Assigned', 'Resolved', 'Escalated'],
    default: 'Open'
  },
  agent_assigned: {
    type: String,
    default: null
  }
}, { timestamps: true });

module.exports = mongoose.model('Ticket', ticketSchema);
