import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  Grid,
  Typography,
  List,
  ListItem,
  ListItemText,
  TextField,
  Button,
  Box,
  Divider,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Tab,
  Tabs,
  Checkbox,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PriorityHighIcon from '@mui/icons-material/PriorityHigh';
import MediumPriorityIcon from '@mui/icons-material/Flag';
import LowPriorityIcon from '@mui/icons-material/FlagOutlined';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import UserInput from './UserInput';
import Axios from 'axios';
import IconButton from '@mui/material/IconButton';
import SendIcon from '@mui/icons-material/Send';
import InfoIcon from '@mui/icons-material/Info';
import CommentIcon from '@mui/icons-material/Comment';
import Avatar from '@mui/material/Avatar';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { useTheme } from '@mui/system';


function TaskDetailDialog({ open, onClose, task, sprint }) {
    const theme = useTheme();

    const [status, setStatus] = useState(task.status || 'Backlog');
    const [assignees, setAssignees] = useState(task.assignees || '');
    const [reporters, setReporters] = useState(task.reporters || '');
    const [originalEstimate, setOriginalEstimate] = useState(task.originalEstimate || '');
    const [errorMessage, setErrorMessage] = useState(''); // State for error message

    const [activeTab, setActiveTab] = useState('information');
    const [newComment, setNewComment] = useState('');
    const [comments, setComments] = useState(task.comments || []);

    const [newSubtask, setNewSubtask] = useState('');
    const [subtasks, setSubtasks] = useState([]);

    useEffect(() => {
      if (activeTab === 'comments') {
        fetchComments(); // Fetch comments initially
        const interval = setInterval(fetchComments, 5000); // Check for new comments every 5 seconds
        return () => clearInterval(interval); // when it returns clear the
      }
      else {
        // fetch the subtasks
        fetchSubtasks();
        const interval2 = setInterval(fetchSubtasks, 5000); // Check for new subtasks every 5 seconds
        return () => clearInterval(interval2); // when it returns clear the
      }
    }, [activeTab]);

    const fetchSubtasks = async () => {
      try {
        const response = await Axios.get(`http://localhost:3001/listSubtasks`, {
          params: {
            taskID: task.id,
          },
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem('authToken')}`,
          },
        });
        if (response.data.success) {
          const fetchedSubtasks = response.data.subtasks;
          if (JSON.stringify(fetchedSubtasks) !== JSON.stringify(subtasks)) {
            setSubtasks(fetchedSubtasks);
          }
        } else {
          console.error('Error fetching subtasks:', response.data.message);
        }
      } catch (error) {
        console.error('Error fetching subtasks:', error);
      }
    };

    const fetchComments = async () => {
      try {
        const response = await Axios.get(`http://localhost:3001/listComments`, {
          params: {
            taskId: task.id, // Add this line to include taskId as a URL parameter
          },
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem('authToken')}`,
          },
        });
        if (response.data.success) {
          const fetchedComments = response.data.comments;
          if (JSON.stringify(fetchedComments) !== JSON.stringify(comments)) {
            setComments(fetchedComments);
          }
        } else {
          console.error('Error fetching comments:', response.data.message);
        }
      } catch (error) {
        console.error('Error fetching comments:', error);
      }
    };

    /* subtask functions */
    const handleAddSubtask = async() => {
      if (newSubtask.trim() !== '') {
        /* send post to store the new subtask */
        const projectID = sessionStorage.getItem('currentProjectID');
        const response = await Axios.post(
          'http://localhost:3001/addSubtask',
          {
            projectID,
            description: newSubtask,
            taskID: task.id,
          },
          {
            headers: {
              Authorization: `Bearer ${sessionStorage.getItem('authToken')}`,
            },
          }
        );

        if (response.data.success) {
          setSubtasks([...subtasks, { id: response.data.id, description: newSubtask, completed: false }]);
          setNewSubtask('');
        }
        else {
          setErrorMessage(response.data.message);
        }
      }
    };

    const handleRemoveSubtask = async (subtaskId) => {

      try {
        const response = await Axios.post(
          'http://localhost:3001/deleteSubtask',
          {
            subtaskID: subtaskId
          },
          {
            headers: {
              Authorization: `Bearer ${sessionStorage.getItem('authToken')}`,
            },
          }
        );

        if (response.data.sucess) {
          setSubtasks(subtasks.filter((subtask) => subtask.id !== subtaskId));
        }
      } catch (error) {
        console.error('Error toggling subtask deletion:', error);
      }
    };

    const handleToggleSubtaskCompletion = async (subtaskId) => {
      setSubtasks(
        subtasks.map((subtask) =>
          subtask.id === subtaskId ? { ...subtask, completed: !subtask.completed } : subtask
        )
      );

      // Send a POST request to update the completion status
      try {
        await Axios.post(
          'http://localhost:3001/subtaskCompleted',
          {
            subtaskID: subtaskId,
            completed: !subtasks.find((subtask) => subtask.id === subtaskId).completed // Toggle completion status
          },
          {
            headers: {
              Authorization: `Bearer ${sessionStorage.getItem('authToken')}`,
            },
          }
        );
      } catch (error) {
        console.error('Error toggling subtask completion:', error);
        // If an error occurs during the request, revert the local state change
        setSubtasks(
          subtasks.map((subtask) =>
            subtask.id === subtaskId ? { ...subtask, completed: !subtask.completed } : subtask
          )
        );
      }
    };
    /* subtask functions end */

    const handleChange = (event, newValue) => {
        setActiveTab(newValue);
    };

    const getPriorityIcon = (priority) => {
        switch (priority) {
          case 'High':
            return <PriorityHighIcon color="error" />;
          case 'Medium':
            return <MediumPriorityIcon color="action" />;
          case 'Low':
            return <LowPriorityIcon color="disabled" />;
          default:
            return null;
        }
    };

    const localTheme = createTheme({
      palette: {
        text: {
          primary: '#000',
        },
        primary: {
          main: "#333333"
        }
      },
    });

    const handleSave = async(e) => {
      // check if changes have been made
      setErrorMessage(''); // Clear previous error messages
      if (!task.assignees) {
        task.assignees = '';
      }

      if (!task.reporters) {
        task.reporters = '';
      }

      if (
        status !== task.status ||
        assignees !== task.assignees ||
        reporters !== task.reporters ||
        String(originalEstimate) !== String(task.originalEstimate)
      ) {
        console.log("Changes made to task details");
        try {
          let newLane = task.lane;
          if (status !== task.status) {
            if (status === "Sprint") {
              newLane = 'To Do';
            }
            else {
              newLane = 'Backlog';
            }
          }

          const projectIDPass = sessionStorage.getItem('currentProjectID');
          const response = await Axios.post(
            'http://localhost:3001/editTask',
            {
              taskId: task.id,
              status: status,
              prevAssignees: task.assignees,
              assignees: assignees,
              reporters: reporters,
              estimatedHours: originalEstimate,
              taskName: task.title,
              taskDescription: task.description,
              projectID: projectIDPass,
              lane: newLane,
            },
            {
              headers: {
                Authorization: `Bearer ${sessionStorage.getItem('authToken')}`,
              },
            }
          );

          if (response.data.success) {
            const updatedTask = {
              ...task,
              status: status,
              assignees: assignees,
              reporters: reporters,
              originalEstimate: originalEstimate,
              assigneeInitials: assignees ? assignees.charAt(0).toUpperCase() : '',
              lane: newLane,
            };
            onClose(updatedTask);
          } else {
            setErrorMessage(response.data.message || "An error occurred. Please try again later.");
            console.error('Error moving task:', response.data.message);
            onClose(null);
          }
        } catch (error) {
          if (error.response && error.response.status === 403) {
            setErrorMessage("You do not have permission to perform this action.");
          } else {
            setErrorMessage("An error occurred. Please try again later.");
          }
          console.error('Error moving task:', error);
        }
      }
      else {
        console.log("no changes to task details");
        onClose(null);
      }
    };

    const handleAddComment = (e) => {
        e.preventDefault(); // This stops the form from submitting traditionally
        if (!newComment.trim()) return; // Ignore empty comments or just spaces

        addComment(newComment); // Call the function to add the comment
        setNewComment(''); // Clear the input field after adding the comment
      };

    const addComment = async (text) => {
        // TODO Backend will probably go here
        console.log("Add Comment");
        try {
          const response = await Axios.post(
            'http://localhost:3001/addComment',
            {
              taskProjectID: task.id,
              commenttext: newComment,
            },
            {
              headers: {
                Authorization: `Bearer ${sessionStorage.getItem('authToken')}`,
              },
            }
          );

          // if it successfully adds the comment then add the comment in frontend
          if (response.data.success) {
            const newComments = [...comments, { text, author: sessionStorage.getItem('user') }];
            setComments(newComments);
            task.comments = newComments;
          }
          else {
            setErrorMessage(response.data.message);
          }
        } catch (error) {
          console.error('Error moving task:', error);
        }
      }

  return (
    <ThemeProvider theme={localTheme}>
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md" sx={{ '& .MuiDialog-paper': { borderRadius: 2, minWidth: '600px' }}}>
      <DialogTitle sx={{ bgcolor: 'primary.main', color: 'common.white', py: 1 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between" sx={{ mx: 2 }}>
          <Typography variant="h6">{task.title}</Typography>
          <Button onClick={onClose} color="inherit" size="small" startIcon={<CloseIcon />}>Close</Button>
        </Box>
      </DialogTitle>
      <DialogContent dividers sx={{ p: 3 }}>
        <Grid container spacing={3}>
          {/* Left Column */}
          <Grid item xs={12} md={6}>
            <Typography variant="h5" sx={{color: 'black'}}>
              This is an issue of type: {task.type}
            </Typography>
            <Typography variant="subtitle2" sx={{  mb: 3 }}>
              Assigned to user story: {task.assignedStoryTitle}
            </Typography>
            <Typography variant="subtitle1" sx={{ mb: 2 }}>
                Description:
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
                {task.description}
            </Typography>
            {/* Subtasks */}
            {activeTab === 'information' && (
            <Box >
                <Typography variant="h6" sx={{ color: "primary", fontWeight: 'bold' }}>Subtasks</Typography>
                <List>
                  {subtasks.map((subtask) => (
                    <ListItem key={subtask.id} disableGutters>
                    <Checkbox
                      checked={subtask.completed}
                      onChange={() => handleToggleSubtaskCompletion(subtask.id)}
                    />
                    <ListItemText
                      primary={subtask.description}
                      primaryTypographyProps={{
                        style: {
                          textDecoration: subtask.completed ? 'line-through' : 'none'
                        }
                      }}
                    />
                    <IconButton onClick={() => handleRemoveSubtask(subtask.id)}>
                      <DeleteIcon />
                    </IconButton>
                  </ListItem>
                  ))}
                </List>
                <TextField
                  fullWidth
                  value={newSubtask}
                  onChange={(e) => setNewSubtask(e.target.value)}
                  label="New Subtask"
                  variant="outlined"
                  sx={{ mt: 2 }}
                />
                <Button
                  onClick={handleAddSubtask}
                  variant="contained"
                  color="secondary"
                  startIcon={<AddIcon />}
                  sx={{ mt: 2 }}
                >
                  Add Subtask
                </Button>
              </Box>
            )}
          </Grid>

          {/* Right Column */}

          <Grid item xs={12} md={6}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                <Tabs value={activeTab} onChange={handleChange} aria-label="task detail tabs" variant="fullWidth" textColor="secondary" indicatorColor="secondary" >
                    <Tab value="information" icon={<InfoIcon />} iconPosition="start" label="Information" />
                    <Tab value="comments" icon={<CommentIcon />} iconPosition="start" label="Comments" />
                </Tabs>
            </Box>
          {activeTab === 'information' ? (
            <List disablePadding>
               {/* Assignees */}
               <ListItem>
                <UserInput user={assignees} setUser={setAssignees} label="Assignee" />
              </ListItem>
              <Divider component="li" />
              <ListItem>
                <UserInput user={reporters} setUser={setReporters} label="Reporter" />
              </ListItem>
              <Divider component="li" />
               {/* Priority */}
               <ListItem>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  {getPriorityIcon(task.priority)} 
                  <Typography variant="body2" sx={{ ml: 1 }}>
                    Priority: {task.priority}
                  </Typography>
                </Box>
              </ListItem>
              <Divider component="li" />
              <ListItem>
              <ListItemText primary="Original Estimate (Hours)" secondary={
                <TextField
                  defaultValue={originalEstimate}
                  type="number"
                  InputProps={{ inputProps: { min: 0 } }}
                  onChange={(e) => setOriginalEstimate(e.target.value)}
                />
              } />
              </ListItem>
              <Divider component="li" />
              <ListItem>
                <ListItemText primary="Time Tracking" secondary={
                  <Box>
                    <Typography variant="body2">{`${task.loggedHours}h logged`}</Typography>
                    <Typography variant="body2">{`${task.originalEstimate}h estimated`}</Typography>
                    {/* progress bar maybe */}
                  </Box>
                } />
              </ListItem>
            </List>
            ) : (
                <Box sx={{ p: 2 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Comments
      </Typography>
      <List sx={{ width: '100%' }}>
        {comments.map((comment, index) => (
          <ListItem key={index} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', bgcolor: 'background.paper', borderRadius: '10px', boxShadow: 1, mb: 2, p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Avatar sx={{ width: 24, height: 24, mr: 1 }}>{comment.author[0]}</Avatar>
              <Typography variant="caption" sx={{ fontWeight: 'bold' }}>{comment.author}</Typography>
            </Box>
            <Typography variant="body2" sx={{ ml: 2.5 }}>{comment.text}</Typography>
          </ListItem>
        ))}
      </List>
      <Box
        component="form"
        sx={{ display: 'flex', alignItems: 'center', mt: 2 }}
        onSubmit={handleAddComment}
      >
        <TextField
          fullWidth
          size="small"
          variant="outlined"
          placeholder="Add a comment..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault(); // Prevent form submit
                handleAddComment(e);
            }
          }}
          InputProps={{
            endAdornment: (
              <IconButton type="submit" size="small" sx={{ p: '10px' }}>
                <SendIcon />
              </IconButton>
            ),
          }}
        />
      </Box>
    </Box>
    )}
            </Grid>
        </Grid>
        {errorMessage && (
            <Typography variant="body2" style={{ color: 'red', textAlign: 'center', marginBottom: '10px' }}>
              {errorMessage}
            </Typography>
          )}
      </DialogContent>
      <Box sx={{ px: 3, py: 2, display: 'flex', justifyContent: 'flex-end' }}>
        <Button onClick={() => { handleSave() }} variant="contained" color="primary" sx={{ textTransform: 'none', mr: 1 }}>
          Save Changes
        </Button>
      </Box>
        
    </Dialog>
    </ThemeProvider> 
  );
}

export default TaskDetailDialog;