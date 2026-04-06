import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { formatDistanceToNow } from 'date-fns';

function App() {
  const [tickets, setTickets] = useState([]);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentTicket, setCurrentTicket] = useState(null);

  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));
  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [userRole, setUserRole] = useState(localStorage.getItem('role') || '');
  const [loggedInUser, setLoggedInUser] = useState(localStorage.getItem('username') || '');

  // Dynamic API URL for Render Deployment
  const API_URL = import.meta.env.VITE_API_URL 
    ? `${import.meta.env.VITE_API_URL}/api`
    : 'http://localhost:5000/api';

  // Form State
  const [customerName, setCustomerName] = useState('');
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('General');
  const [description, setDescription] = useState('');
  const [urgency, setUrgency] = useState('Low');

  const [agentName, setAgentName] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      fetchTickets();
      // Auto refresh every 5 minutes backwards
      const interval = setInterval(fetchTickets, 300000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_URL}/login`, { username: loginUser, password: loginPass });
      if (res.data.token) {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('role', res.data.role);
        localStorage.setItem('username', res.data.username);
        setUserRole(res.data.role);
        setLoggedInUser(res.data.username);
        setIsAuthenticated(true);
      }
    } catch (error) {
       alert(error.response?.data?.message || 'Invalid login');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('username');
    setIsAuthenticated(false);
    setUserRole('');
    setLoggedInUser('');
  };

  const fetchTickets = async () => {
    try {
      const role = localStorage.getItem('role');
      const user = localStorage.getItem('username');
      const query = role === 'customer' ? `?customer_name=${user}` : '';
      const res = await axios.get(`${API_URL}/tickets${query}`);
      setTickets(res.data);
    } catch (error) {
      console.error("Error fetching tickets", error);
    }
  };

  const openModal = (ticket = null) => {
    setCurrentTicket(ticket);
    const isAdmin = userRole === 'admin';
    if (ticket) {
      setCustomerName(ticket.customer_name);
      setSubject(ticket.subject);
      setCategory(ticket.category);
      setDescription(ticket.description);
      setUrgency(ticket.urgency);
      setAgentName(ticket.agent_assigned || '');
    } else {
      setCustomerName(isAdmin ? '' : loggedInUser);
      setSubject('');
      setCategory('General');
      setDescription('');
      setUrgency('Low');
      setAgentName('');
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentTicket(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description.trim()) {
      alert("Description cannot be empty");
      return;
    }
    try {
      const payload = {
        customer_name: customerName,
        subject,
        category,
        description,
        urgency
      };

      if (currentTicket) {
        if (currentTicket.status === 'Resolved') {
          alert('Ticket is resolved and locked.');
          return;
        }
        await axios.put(`${API_URL}/tickets/${currentTicket._id}`, payload);
      } else {
        await axios.post(`${API_URL}/tickets`, payload);
      }
      fetchTickets();
      closeModal();
    } catch (error) {
      alert(error.response?.data?.message || "An error occurred");
    }
  };

  const handleAssignAgent = async (id, agent) => {
    if (!agent) {
      alert("Please provide an agent name");
      return;
    }
    try {
      await axios.put(`${API_URL}/tickets/${id}/assign`, { agent_name: agent });
      fetchTickets();
      if (currentTicket && currentTicket._id === id) closeModal();
    } catch (error) {
      alert(error.response?.data?.message || "An error occurred");
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await axios.put(`${API_URL}/tickets/${id}`, { status });
      fetchTickets();
      if (currentTicket && currentTicket._id === id) closeModal();
    } catch (error) {
      alert(error.response?.data?.message || "An error occurred");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this ticket?")) {
      try {
        await axios.delete(`${API_URL}/tickets/${id}`);
        fetchTickets();
      } catch (error) {
        alert("Error deleting ticket");
      }
    }
  };

  // Sorting Logic: Priority Engine (Billing + High) -> Pinned to top
  const sortedTickets = [...tickets].sort((a, b) => {
    const isAPriority = a.category === 'Billing' && a.urgency === 'High';
    const isBPriority = b.category === 'Billing' && b.urgency === 'High';
    
    if (isAPriority && !isBPriority) return -1;
    if (!isAPriority && isBPriority) return 1;
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  const filteredTickets = sortedTickets.filter(ticket => 
    ticket.customer_name.toLowerCase().includes(search.toLowerCase())
  );

  // Counters
  const total = tickets.length;
  const pending = tickets.filter(t => t.status === 'Open' || t.status === 'Assigned' || t.status === 'In-Progress').length;
  const resolvedCount = tickets.filter(t => t.status === 'Resolved').length;

  if (!isAuthenticated) {
    return (
      <div className="login-container">
        <div className="login-card">
          <h2>Welcome to SupportStream</h2>
          <p>Login to your portal</p>
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label>Username</label>
              <input type="text" className="form-control" placeholder="Enter 'admin' or your own name" value={loginUser} onChange={e => setLoginUser(e.target.value)} required />
            </div>
            <div className="form-group" style={{marginBottom: '1.5rem'}}>
              <label>Password</label>
              <input type="password" className="form-control" placeholder="Any password works for customers" value={loginPass} onChange={e => setLoginPass(e.target.value)} required />
            </div>
            <button type="submit" className="btn-primary">Sign In</button>
          </form>
          <div style={{marginTop: '1.5rem', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)'}}>
            <b>Admin:</b> admin / admin123 <br/>
            <b>Customer:</b> Type any other name to login as a Customer!
          </div>
        </div>
      </div>
    );
  }

  const isAdmin = userRole === 'admin';

  return (
    <div className="container">
      <header>
        <div>
          <h1>SupportStream</h1>
          <p style={{color: 'var(--text-muted)'}}>
            {isAdmin ? 'System Administrator Portal' : `Welcome, ${loggedInUser} (Customer Portal)`}
          </p>
        </div>
        <button onClick={handleLogout} className="btn-secondary">Logout</button>
      </header>

      <div className="counters">
        <div className="counter-card">
          <span className="label">Total Tickets</span>
          <span className="value">{total}</span>
        </div>
        <div className="counter-card" style={{borderLeft: '4px solid var(--warning)'}}>
          <span className="label">Pending</span>
          <span className="value">{pending}</span>
        </div>
        <div className="counter-card" style={{borderLeft: '4px solid var(--success)'}}>
          <span className="label">Resolved</span>
          <span className="value">{resolvedCount}</span>
        </div>
      </div>

      <div className="table-container">
        <div className="table-header">
          <input 
            type="text" 
            className="search-input" 
            placeholder="Search by Customer Name..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button className="btn-primary" onClick={() => openModal()}>+ Create Ticket</button>
        </div>
        <table>
          <thead>
            <tr>
              <th>Customer</th>
              <th>Subject</th>
              <th>Category</th>
              <th>Urgency</th>
              <th>Status</th>
              <th>Time</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredTickets.map(ticket => {
              const isPriority = ticket.category === 'Billing' && ticket.urgency === 'High';
              return (
                <tr key={ticket._id} className={isPriority ? 'priority-high' : ''}>
                  <td style={{fontWeight: '500'}}>{ticket.customer_name}</td>
                  <td>{ticket.subject}</td>
                  <td>{ticket.category}</td>
                  <td>{ticket.urgency}</td>
                  <td>
                    <span className={`badge badge-${ticket.status.toLowerCase().replace('-', '')}`}>
                      {ticket.status}
                    </span>
                  </td>
                  <td style={{fontSize: '0.875rem', color: 'var(--text-muted)'}}>
                    {formatDistanceToNow(new Date(ticket.createdAt))} ago
                  </td>
                  <td>
                    <button 
                       style={{marginRight: '0.5rem', background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer'}}
                       onClick={() => openModal(ticket)}>
                       {isAdmin ? 'Manage' : 'View / Edit'}
                    </button>
                    {(isAdmin && !ticket.status.includes('Resolved')) && (
                       <button 
                         style={{background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer'}}
                         onClick={() => handleDelete(ticket._id)}>
                         Delete
                       </button>
                    )}
                  </td>
                </tr>
              )
            })}
            {filteredTickets.length === 0 && (
              <tr>
                <td colSpan="7" style={{textAlign: 'center', padding: '2rem'}}>No tickets found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>{currentTicket ? 'Manage Ticket' : 'Create Ticket'}</h2>
            
            {currentTicket && currentTicket.status === 'Resolved' && (
              <div style={{background: 'var(--warning-light)', color: 'var(--warning)', padding: '0.5rem', borderRadius: '0.375rem', marginBottom: '1rem', fontSize: '0.875rem'}}>
                 This ticket is resolved and locked. It cannot be edited.
              </div>
            )}

            {currentTicket && currentTicket.status === 'Escalated' && (
              <div style={{background: 'var(--danger-light)', color: 'var(--danger)', padding: '0.5rem', borderRadius: '0.375rem', marginBottom: '1rem', fontSize: '0.875rem'}}>
                 ⚠️ WARNING: This ticket has been escalated. Please resolve immediately.
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div style={{display: 'flex', gap: '1rem'}}>
                <div className="form-group" style={{flex: 1}}>
                  <label>Customer Name</label>
                  <input type="text" className="form-control" required value={customerName} onChange={e => setCustomerName(e.target.value)} disabled={(!isAdmin) || (currentTicket?.status === 'Resolved')} />
                </div>
                <div className="form-group" style={{flex: 1}}>
                  <label>Subject</label>
                  <input type="text" className="form-control" required value={subject} onChange={e => setSubject(e.target.value)} disabled={currentTicket?.status === 'Resolved'} />
                </div>
              </div>

              <div style={{display: 'flex', gap: '1rem'}}>
                <div className="form-group" style={{flex: 1}}>
                  <label>Category</label>
                  <select className="form-control" value={category} onChange={e => setCategory(e.target.value)} disabled={currentTicket?.status === 'Resolved'}>
                    <option>General</option>
                    <option>Technical</option>
                    <option>Billing</option>
                  </select>
                </div>
                <div className="form-group" style={{flex: 1}}>
                  <label>Urgency</label>
                  <select className="form-control" value={urgency} onChange={e => setUrgency(e.target.value)} disabled={currentTicket?.status === 'Resolved'}>
                    <option>Low</option>
                    <option>Medium</option>
                    <option>High</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea className="form-control" rows="3" required value={description} onChange={e => setDescription(e.target.value)} disabled={currentTicket?.status === 'Resolved'}></textarea>
              </div>

              {(currentTicket && isAdmin) && (
                <>
                  <hr style={{margin: '1.5rem 0', borderColor: 'var(--border)'}} />
                  <div style={{display: 'flex', gap: '1rem', alignItems: 'flex-end'}}>
                     <div className="form-group" style={{flex: 1, marginBottom: 0}}>
                      <label>Assign Agent</label>
                      <input type="text" className="form-control" placeholder="Agent Name" value={agentName} onChange={e => setAgentName(e.target.value)} disabled={currentTicket?.status === 'Resolved'} />
                    </div>
                    <button type="button" className="btn-secondary" onClick={() => handleAssignAgent(currentTicket._id, agentName)} disabled={currentTicket?.status === 'Resolved'}>
                      Assign
                    </button>
                  </div>
                  
                  <div className="form-group" style={{marginTop: '1rem'}}>
                    <label>Update Status</label>
                    <select className="form-control" value={currentTicket.status} onChange={e => handleStatusChange(currentTicket._id, e.target.value)} disabled={currentTicket?.status === 'Resolved'}>
                      <option disabled>{currentTicket.status}</option>
                      <option value="Open">Open</option>
                      <option value="In-Progress">In-Progress</option>
                      <option value="Resolved">Resolved</option>
                    </select>
                  </div>
                </>
              )}

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={closeModal}>Cancel</button>
                {(!currentTicket || currentTicket.status !== 'Resolved') && (
                  <button type="submit" className="btn-primary" style={{background: 'var(--success)', color: 'white'}}>
                    {currentTicket ? 'Save Changes' : 'Create Ticket'}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
