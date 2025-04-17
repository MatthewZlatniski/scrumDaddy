import React, { useState, useEffect } from 'react';
import { Box, Card, CardContent, Typography, IconButton, TextField, Tooltip, Button, CircularProgress } from '@mui/material';
import { useTheme } from '@mui/system';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import Axios from 'axios';

function UserTasks() {
  const theme = useTheme();
  const [userTasks, setUserTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedProjectID, setSelectedProjectID] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [loggedHours, setLoggedHours] = useState(0);

  useEffect(() => {
    const projectID = sessionStorage.getItem('currentProjectID');
    setSelectedProjectID(projectID);
    if (projectID) {
      fetchTasks(projectID);
    }
  }, []);

  const fetchTasks = async (projectID) => {
    try {
      setLoading(true);
      console.log("list user tasks for project ID:", projectID);

      const response = await Axios.post('http://localhost:3001/listUserTasks', { projectID }, {
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem('authToken')}`,
        },
      });

      if (response.data.success) {
        console.log("returned tasks: ", response.data.tasks);
        setUserTasks(response.data.tasks);
      }
    } catch (error) {
      console.error('Error fetching task list:', error);
      setError('Error fetching task list. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogHours = (task) => {
    setSelectedTask(task);
    setLoggedHours(task.loggedHours);
    const projectID = sessionStorage.getItem('currentProjectID');
    fetchTasks(projectID);
  };

  const handleAdjustHours = (change) => {
    setLoggedHours(Math.max(0, loggedHours + change));
  };

  const handleSubmitHours = async () => {
    console.log("submitted hours");
    try {
      if (loggedHours === selectedTask.loggedHours) {
        // If the logged hours remain unchanged, no need to make a post request
        setLoggedHours(0);
        setSelectedTask(null);
        return;
      }

      const response = await Axios.post('http://localhost:3001/logHours', {
        taskId: selectedTask.id,
        loggedHours: loggedHours,
      }, {
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem('authToken')}`,
        },
      });
      if (response.data.success) {
        setUserTasks((prevUserTasks) =>
          prevUserTasks.map((task) =>
            task.id === selectedTask.id ? { ...task, loggedHours: loggedHours } : task
          )
        );
        setLoggedHours(0);
        setSelectedTask(null);
      } else {
        console.error('Error updating logged hours:', response.data.message);
      }
    } catch (error) {
      console.error('Error updating logged hours:', error);
    }
    const projectID = sessionStorage.getItem('currentProjectID');
    fetchTasks(projectID);
  };

  function truncateString(str, num) {
    if (str.length <= num) {
      return str;
    }
    return str.slice(0, num) + '...';
  }

  return (
    <Box sx={{ flexGrow: 1, p: 2 }}>
      <Typography variant="h4" sx={{ mb: 2, color: theme.palette.text.primary }}>
        {selectedProjectID ? 'Your Tasks' : 'No project selected'}
      </Typography>
      <Box sx={{ overflowX: userTasks.length > 0 ? 'scroll' : 'hidden' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
            <CircularProgress color="secondary" />
          </Box>
        ) : selectedProjectID ? (
          userTasks.length === 0 ? (
            <Typography variant="body1" sx={{ color: theme.palette.text.primary }}>No tasks assigned.</Typography>
          ) : (
            <Box sx={{ display: 'inline-flex', gap: 2 }}>
              {userTasks.map((task) => (
                <Box key={task.id} sx={{ minWidth: 300 }}>
                  <Card
                    sx={{
                      backgroundColor: theme.palette.primary.main,
                      height: '175px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between'
                    }}>
                    <CardContent>
                      <Typography variant="h5" component="div" color='text.secondary'>
                        {task.title}
                      </Typography>
                      <Typography sx={{ mb: 1.5 }} color="text.primary">
                        {truncateString(task.description, 70)}
                      </Typography>
                      {selectedTask && selectedTask.id === task.id ? (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                          <Tooltip title="Decrease Hours">
                            <IconButton onClick={() => handleAdjustHours(-1)}>
                              <RemoveIcon />
                            </IconButton>
                          </Tooltip>
                          <TextField
                            size="small"
                            value={loggedHours}
                            onChange={(e) => setLoggedHours(Math.max(0, parseInt(e.target.value) || 0))}
                            sx={{ width: '60px', textAlign: 'center' }}
                          />
                          <Tooltip title="Increase Hours">
                            <IconButton onClick={() => handleAdjustHours(1)}>
                              <AddIcon />
                            </IconButton>
                          </Tooltip>
                          <Button variant="contained" onClick={handleSubmitHours}>Submit</Button>
                        </Box>
                      ) : (
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', mt: 2 }}>
                          <Tooltip title="Log Hours">
                            <IconButton onClick={() => handleLogHours(task)}>
                              <AccessTimeIcon sx={{color: theme.palette.text.secondary}}/>
                            </IconButton>
                          </Tooltip>
                          <Typography variant="body2">
                            {task.loggedHours} Hours
                          </Typography>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Box>
              ))}
            </Box>
          )
        ) : null}
      </Box>
    </Box>
  );
}

export default UserTasks;