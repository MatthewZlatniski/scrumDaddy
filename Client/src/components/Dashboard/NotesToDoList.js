import React, { useState } from 'react';
import { Box, TextField, Button, List, ListItem, ListItemText, IconButton, Checkbox } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { useTheme } from '@mui/system';

function NotesToDoList() {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState('');

  // Handle adding new tasks
  const handleAddTask = () => {
    if (!newTask.trim()) return;
    const task = {
      id: Date.now(), // Simple unique ID for demo
      text: newTask,
      completed: false,
    };
    setTasks([...tasks, task]);
    setNewTask('');
  };

  // Handle task completion toggle
  const toggleComplete = (id) => {
    setTasks(tasks.map(task => task.id === id ? { ...task, completed: !task.completed } : task));
  };

  // Handle removing tasks
  const handleRemoveTask = (id) => {
    setTasks(tasks.filter(task => task.id !== id));
  };

  const theme = useTheme();
  return (
    <Box sx={{ maxWidth: 500, margin: 'auto', mt: 4 }}>
      <TextField
        label="Add a new note"
        variant="outlined"
        fullWidth
        value={newTask}
        onChange={(e) => setNewTask(e.target.value)}
        onKeyPress={(e) => e.key === 'Enter' && handleAddTask()}
        InputLabelProps={{
          style: { color: 'text.primary' }, // Set label text color
        }}
        sx={{
          '& label.Mui-focused': {
            color: 'text.primary', // Set focused label color
          },
          '& .MuiOutlinedInput-root': {
            '& fieldset': {
              borderColor: 'primary.main', // Set outline color
            },
            '&:hover fieldset': {
              borderColor: 'text.primary', // Set hover outline color
            },
            '&.Mui-focused fieldset': {
              borderColor: 'text.primary', // Set focused outline color
            },
          },
          '& .MuiInputBase-input': {
            color: 'text.primary', // Set input text color
          }, 
        }}
      />
      <Button onClick={handleAddTask} sx={{ mt: 2, mb: 2, color: theme.palette.text.primary, bgcolor: theme.palette.primary.main, '&:hover': {bgcolor: theme.palette.secondary.main,},}}>
        Add Note
      </Button>
      <List>
        {tasks.map((task) => (
          <ListItem
            key={task.id}
            secondaryAction={
              <IconButton edge="end" aria-label="delete" onClick={() => handleRemoveTask(task.id)}>
                <DeleteIcon sx={{ color: theme.palette.text.secondary }}/>
              </IconButton>
            }
            disablePadding
          >
            <Checkbox
              edge="start"
              checked={task.completed}
              tabIndex={-1}
              disableRipple
              inputProps={{ 'aria-labelledby': task.id }}
              onChange={() => toggleComplete(task.id)}
            />
            <ListItemText id={task.id} primary={task.text} sx={{ textDecoration: task.completed ? 'line-through' : 'none' }} />
          </ListItem>
        ))}
      </List>
    </Box>
  );
}

export default NotesToDoList;
