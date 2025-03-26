import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Container, Typography, Box, TextField, Button, Paper, List, ListItem, ListItemText, CircularProgress } from '@mui/material';
import socketIOClient from 'socket.io-client';

const ENDPOINT = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

function Room({ roomId }) {
  const [noteContent, setNoteContent] = useState('');
  const [typingUsers, setTypingUsers] = useState([]);
  const [users, setUsers] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const socketRef = useRef();

  useEffect(() => {
    socketRef.current = socketIOClient(ENDPOINT);

    socketRef.current.on('connect', () => {
      socketRef.current.emit('joinRoom', roomId);
      socketRef.current.emit('userJoined', roomId, socketRef.current.id);
    });

    socketRef.current.on('noteUpdate', (content) => {
      setNoteContent(content);
    });

    socketRef.current.on('userTyping', (userId) => {
      setTypingUsers((prev) => [...new Set([...prev, userId])]);
    });

    socketRef.current.on('userJoined', (userId) => {
      setUsers((prev) => [...new Set([...prev, userId])]);
    });

    socketRef.current.on('userLeft', (userId) => {
      setUsers((prev) => prev.filter((id) => id !== userId));
      setTypingUsers((prev) => prev.filter((id) => id !== userId));
    });

    return () => {
      socketRef.current.disconnect();
    };
  }, [roomId]);

  const handleNoteChange = (e) => {
    const content = e.target.value;
    setNoteContent(content);
    socketRef.current.emit('updateNote', roomId, content);
    setIsTyping(true);
    
    // Reset typing status after 2 seconds of inactivity
    const timer = setTimeout(() => {
      setIsTyping(false);
    }, 2000);

    return () => clearTimeout(timer);
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Collaborative Notes
      </Typography>
      
      <Box sx={{ display: 'flex', gap: 2, mb: 4 }}>
        <TextField
          label="Room ID"
          value={roomId}
          disabled
          sx={{ flex: 1 }}
        />
        <Button
          variant="contained"
          color="primary"
          component={Link}
          to="/"
        >
          Back to Home
        </Button>
      </Box>

      <Paper sx={{ p: 2, mb: 4 }}>
        <TextField
          fullWidth
          multiline
          rows={10}
          value={noteContent}
          onChange={handleNoteChange}
          placeholder="Start typing your notes..."
        />
      </Paper>

      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Users in Room ({users.length})
        </Typography>
        <List>
          {users.map((user) => (
            <ListItem key={user}>
              <ListItemText
                primary={user}
                secondary={typingUsers.includes(user) ? 'typing...' : ''}
              />
            </ListItem>
          ))}
        </List>
      </Paper>
    </Container>
  );
}

function Home() {
  const [roomId, setRoomId] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!roomId) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Real-Time Collaborative Notes
      </Typography>
      
      <Paper sx={{ p: 4 }}>
        <Typography variant="h6" gutterBottom>
          Join a Room
        </Typography>
        
        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Room ID"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            sx={{ mb: 2 }}
          />
          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Join Room'}
          </Button>
        </form>
      </Paper>
    </Container>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/room/:roomId" element={<Room />} />
      </Routes>
    </Router>
  );
}

export default App;
