import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  Grid,
  Typography,
  TextField,
  Button,
  Box,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import IconButton from '@mui/material/IconButton';
import UserInput from './UserInput';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import Axios from 'axios';

function CreateTask({ open, onClose }) {
    const [assignees, setAssignees] = useState('');
    const [reporters, setReporters] = useState('');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState('Medium');
    const [originalEstimate, setOriginalEstimate] = useState('');
    const [taskType, setTaskType] = useState('Task');
    const [errorMessage, setErrorMessage] = useState('');
    const [userStories, setUserStories] = useState([]);
    const [userStory, setUserStory] = useState({ id: '', title: '' });

    const resetFields = () => {
        setAssignees('');
        setReporters('');
        setPriority('Medium');
        setOriginalEstimate('');
        setTitle('');
        setTaskType('Task');
        setDescription('');
    };

    const handleClose = () => {
        setErrorMessage('');
        resetFields();
        onClose();
    };

    useEffect(() => {
      const fetchData = async () => {
          console.log("need stories");
          const projectID = sessionStorage.getItem('currentProjectID');
          try {
              const response = await Axios.post('http://localhost:3001/listStoriesForTask', {projectID},{
                  headers: {
                    Authorization: `Bearer ${sessionStorage.getItem('authToken')}`,
                  },
              });
              setUserStories(response.data.userStories);
              if (response.data.userStories.length > 0) {
                  setUserStory(response.data.userStories[0]);
              }
          } catch (error) {
              console.error('Error fetching user stories:', error);
              setErrorMessage('Error fetching user stories. Please try again later.');
          }
      };
      if (open) {
          fetchData();
      }
    }, [open]);

    const localTheme = createTheme({
      palette: {
        text: {
          primary: '#000', // Replace with your desired color value
        },
        primary: {
          main: "#333333"
        }
      },
    });

    const handleFieldClick = () => {
      setErrorMessage('');
    };

    const handleSaveNewTask = async () => {
        const authToken = sessionStorage.getItem('authToken');
        const projectID = sessionStorage.getItem('currentProjectID');
        const data_task = {
          taskName: title,
          taskType,
          taskDescription: description,
          priority,
          estimatedHours: originalEstimate,
          assignedUser: assignees,
          reporter: reporters,
          loggedHours: 0,
          projectID,
          assignedStoryID: userStory.id,
          assignedStoryTitle: userStory.title,
        };

        try {
          const response = await Axios.post('http://localhost:3001/addTask', data_task, {
            headers: {
              Authorization: `Bearer ${authToken}`,
            },
          });

          if (response.data.success) {
            resetFields();
            onClose();
            window.location.reload(); // Refresh the window after successful task creation
            setErrorMessage('');
          }
          else {
            console.log("error adding task.");
            setErrorMessage(response.data.message);
          }
        } catch (error) {
          console.error('Error saving task:', error);
          setErrorMessage('Error saving task. Please try again later.');
        }
    };

    return (
        <ThemeProvider theme={localTheme}>
            <Dialog open={open} onClose={handleClose} fullWidth maxWidth="md">
                <DialogTitle sx={{ bgcolor: 'primary.main', color: 'common.white' }}>
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                        <Typography variant="h6">Create New Task</Typography>
                        <IconButton onClick={handleClose} color="inherit">
                            <CloseIcon />
                        </IconButton>
                    </Box>
                </DialogTitle>
                <DialogContent dividers>
                    <Grid container spacing={3}>
                        {/* Left Column */}
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                margin="normal"
                                label="Task Title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                onClick={handleFieldClick}
                            />
                            <FormControl fullWidth margin="normal">
                                <InputLabel id="task-type-select-label">Task Type</InputLabel>
                                <Select
                                    labelId="task-type-select-label"
                                    id="taskType"
                                    value={taskType}
                                    label="Task Type"
                                    onChange={(e) => setTaskType(e.target.value)}
                                    onClick={handleFieldClick}
                                >
                                    <MenuItem value="Task">Task</MenuItem>
                                    <MenuItem value="Bug">Bug</MenuItem>
                                    <MenuItem value="Feature">Feature</MenuItem>
                                </Select>
                            </FormControl>
                            <TextField
                                fullWidth
                                margin="normal"
                                label="Description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                multiline
                                rows={4}
                                onClick={handleFieldClick}
                            />
                        </Grid>
                        {/* Right Column */}
                        <Grid item xs={12} md={6}>
                        <FormControl fullWidth margin="normal">
                                <InputLabel id="task-story-select-label">User Story</InputLabel>
                                <Select
                                    labelId="task-story-select-label"
                                    id="userStory"
                                    value={userStory.id} // Use userStory.id
                                    label = "User Story"
                                    onChange={(e) => setUserStory(userStories.find(story => story.id === e.target.value))}
                                    onClick={handleFieldClick}
                                    disabled={userStories.length === 0} // Disable if no user stories available
                                >
                                    {userStories.map((story) => (
                                        <MenuItem key={story.id} value={story.id}>{story.title}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            {/* Assignees Input */}
                            <UserInput user={assignees} setUser={setAssignees} label="Assignee" />

                            {/* Reporters Input */}
                            <UserInput user={reporters} setUser={setReporters} label="Reporter" />

                            {/* Priority Selection */}
                            <FormControl fullWidth margin="normal">
                                <InputLabel id="priority-select-label">Priority</InputLabel>
                                <Select
                                    labelId="priority-select-label"
                                    id="priority"
                                    value={priority}
                                    label="Priority"
                                    onChange={(e) => setPriority(e.target.value)}
                                    onClick={handleFieldClick}
                                >
                                    <MenuItem value="High">High</MenuItem>
                                    <MenuItem value="Medium">Medium</MenuItem>
                                    <MenuItem value="Low">Low</MenuItem>
                                </Select>
                            </FormControl>

                            {/* Original Estimate Input */}
                            <TextField
                                fullWidth
                                margin="normal"
                                label="Original Estimate (Hours)"
                                value={originalEstimate}
                                onChange={(e) => setOriginalEstimate(e.target.value)}
                                type="number"
                                InputProps={{ inputProps: { min: 0 } }}
                                onClick={handleFieldClick}
                            />
                        </Grid>
                    </Grid>
                    {errorMessage && (
                        <Typography variant="body2" color="error" sx={{ mt: 2 }}>
                            {errorMessage}
                        </Typography>
                    )}
                </DialogContent>
                <Box sx={{ px: 3, py: 2, display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                        onClick={handleSaveNewTask}
                        variant="contained"
                        color="primary"
                        disabled={userStories.length === 0} // Disable if no user stories available
                    >
                        Save Task
                    </Button>
                </Box>
            </Dialog>
        </ThemeProvider>
    );
}

export default CreateTask;