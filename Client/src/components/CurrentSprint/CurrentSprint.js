import React, { useState, useEffect } from 'react';
import { Box, Button, Typography, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import Sidebar from '../sharedComponents/Sidebar';
import TopBar from '../sharedComponents/Topbar';
import Status from './Status';
import './Board.css';
import Axios from 'axios';
import { useTheme } from '@mui/system';

function CurrentSprint({ onUpdateTheme }) {
  const lanes = [
    { id: 1, title: 'To Do' },
    { id: 2, title: 'In Progress' },
    { id: 3, title: 'Review' },
    { id: 4, title: 'Done' },
  ];

  const theme = useTheme();

  function onDragStart(e, id) {
    setError('');
    e.dataTransfer.setData('id', id);
  }

  function onDragOver(e) {
    e.preventDefault();
  }

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentSprint, setCurrentSprint] = useState('');
  const [maxSprint, setMaxSprint] = useState('');
  const [showNextSprintDialog, setShowNextSprintDialog] = useState(false);
  const [showIncompleteUserStoriesDialog, setShowIncompleteUserStoriesDialog] = useState(false);

  function onDrop(e, laneId) {
    const id = e.dataTransfer.getData('id');
    const updatedTasks = tasks.map((task) => {
      if (task.id.toString() === id) {
        task.lane = lanes.find((lane) => lane.id === laneId).title;

        // Update lane on the backend as well
        const projectIDPass = sessionStorage.getItem('currentProjectID');
        Axios.post(
          'http://localhost:3001/editTask',
          {
            taskId: task.id,
            status: task.status,
            prevAssignees: task.assignees,
            assignees: task.assignees,
            reporters: task.reporters,
            estimatedHours: task.originalEstimate,
            taskName: task.title,
            taskDescription: task.description,
            projectID: projectIDPass,
            lane: task.lane,
          },
          {
            headers: {
              Authorization: `Bearer ${sessionStorage.getItem('authToken')}`,
            },
          }
        );
      }
      return task;
    });

    setTasks(updatedTasks);
  }

  useEffect(() => {
    fetchCurrentSprint();
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const projectID = sessionStorage.getItem('currentProjectID');

      const response = await Axios.post(
        'http://localhost:3001/listTaskForCurrentSprint',
        { projectID },
        {
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem('authToken')}`,
          },
        }
      );

      if (response.data.success) {
        setTasks(response.data.tasks);
      } else {
        setError('Error fetching task list. Please try again.');
      }
    } catch (error) {
      setError('Error fetching task list. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentSprint = async () => {
    try {
      const projectID = sessionStorage.getItem('currentProjectID');

      const response = await Axios.post(
        'http://localhost:3001/getCurrentSprint',
        { projectID },
        {
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem('authToken')}`,
          },
        }
      );

      if (response.data.success) {
        setCurrentSprint(response.data.currentSprint);
        setMaxSprint(response.data.maxSprint);
      } else {
        setError('Error finding current sprint. Please try again.');
      }
    } catch (error) {
      setError('Error fetching current sprint. Please try again.');
    }
  };

  const moveToNextSprint = async (confirmed) => {
    try {
      if (!confirmed) return;

      const projectID = sessionStorage.getItem('currentProjectID');

      const response = await Axios.post(
        'http://localhost:3001/moveToNextSprint',
        { projectID },
        {
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem('authToken')}`,
          },
        }
      );

      if (response.data.success) {
        checkIncompleteTasksBeforeMove();
      } else {
        setError(response.data.message);
      }
    } catch (error) {
      setError('Error moving to next sprint. Please try again.');
    }
  };

  const handleNextSprintDialogClose = (confirmed) => {
    setShowNextSprintDialog(false);
    moveToNextSprint(confirmed);
  };

  const handleIncompleteUserStoriesDialogClose = () => {
    setShowIncompleteUserStoriesDialog(false);
    window.location.reload();
  };

  const handleMoveToNextSprintConfirmation = () => {
    setShowNextSprintDialog(false);
    moveToNextSprint(true);
  };

  const handleIncompleteUserStoriesConfirmation = async() => {
    console.log("move confirmed");
    try {
      const projectID = sessionStorage.getItem('currentProjectID');

      const data = {
        projectID,
        currentSprint,
      }

      const response = await Axios.post(
        'http://localhost:3001/moveUserStoriesToNextSprint',
        data,
        {
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem('authToken')}`,
          },
        }
      );

      if (response.data.success) {
        setShowIncompleteUserStoriesDialog(false);
        window.location.reload();
      } else {
        setError(response.data.message);
      }
    } catch (error) {
      setError('Error moving user stories to next sprint. Please try again.');
    }
    // move the user stories
  };

  const checkIncompleteTasksBeforeMove = () => {
    const incompleteTasks = tasks.filter(task => task.lane !== 'Done');
    if (incompleteTasks.length !== 0) {
      setShowIncompleteUserStoriesDialog(true);
    }
    else {
      window.location.reload();
    }
  };

  const handleMoveToNextSprint = () => {
    if (currentSprint === maxSprint) {
      setError("You are already on the final sprint.");
    } else {
      setShowNextSprintDialog(true);
    }
  };

  return (
    <div>
      <Box sx={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1100 }}>
        <TopBar completed={30} inProgress={40} title="Current Sprint" onUpdateTheme={onUpdateTheme} />
      </Box>
      <Box sx={{ display: 'flex', mt: 2, justifyContent: 'center' }}>
        <Sidebar />

        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ display: 'flex', mt: 12, mb: 2, justifyContent: 'left' }}>
            <Box sx={{border: '1px solid', borderColor: theme.palette.text.secondary, padding: '20px', borderRadius: '10px', marginRight: '20px' }}>
              <Typography sx={{color: theme.palette.text.secondary}} variant="body1" fontWeight="bold">Current Sprint: {currentSprint}</Typography>
            </Box>
            {currentSprint !== maxSprint && (
              <Button 
                variant="contained" 
                onClick={handleMoveToNextSprint} 
                sx={{ backgroundColor: theme.palette.text.secondary, color: theme.palette.text.primary, fontSize: '20px', padding: '15px 20px', fontWeight: 'bold', textTransform: 'none', mr: 3 }}
              >
                Move to Next Sprint
              </Button>
            )}
             {error && (
                <Box mt={2} display="flex" justifyContent="center">
                  <Typography variant="body1" color="error">
                    {error}
                  </Typography>
                </Box>
              )}
          </Box>
          <div className='Board-wrapper'>
            {lanes.map((lane) => (
              <Status
                key={lane.id}
                laneId={lane.id}
                title={lane.title}
                tasks={tasks.filter((task) => task.lane === lane.title)}
                onDragStart={onDragStart}
                onDragOver={onDragOver}
                onDrop={onDrop}
              />
            ))}
          </div>
          </Box>
      </Box>
      <Dialog open={showNextSprintDialog} onClose={() => handleNextSprintDialogClose(false)}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, bgcolor: theme.palette.primary.main, color: theme.palette.text.primary}}>
          <InfoIcon sx={{ color: theme.palette.text.secondary }} />
          Move to Next Sprint
        </DialogTitle>

        <DialogContent sx={{bgcolor: theme.palette.primary.main}}>
          <Typography variant="body1" sx={{ margin: 2, color: theme.palette.text.primary}}>
            Are you sure you would like to continue to the next sprint?
          </Typography>
        </DialogContent>
        <DialogActions sx={{bgcolor: theme.palette.primary.main}}>
          <Button onClick={() => handleNextSprintDialogClose(false)} sx={{color: theme.palette.text.secondary, fontSize: '1rem', '&:hover': { color: theme.palette.text.secondary, fontWeight: 'bold', border: '1px solid'}}}>No</Button>
          <Button onClick={handleMoveToNextSprintConfirmation} sx={{color: theme.palette.text.secondary, fontSize: '1rem', '&:hover': { color: theme.palette.text.secondary, fontWeight: 'bold', border: '1px solid'}}}>
            Yes
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog open={showIncompleteUserStoriesDialog} onClose={handleIncompleteUserStoriesDialogClose}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, bgcolor: theme.palette.primary.main, color: theme.palette.text.primary}}>
          <InfoIcon color="warning" />
          Incomplete User Stories
        </DialogTitle>
        <DialogContent sx={{  bgcolor: theme.palette.primary.main }}>
          <Typography variant="body1" sx={{ margin: 2, color: theme.palette.text.primary}}>
            Would you like to move any unfinished user stories to the next sprint?
          </Typography>
        </DialogContent>
        <DialogActions sx={{bgcolor: theme.palette.primary.main}}>
          <Button onClick={handleIncompleteUserStoriesDialogClose} sx={{color: theme.palette.text.secondary, fontSize: '1rem', '&:hover': { color: theme.palette.text.secondary, fontWeight: 'bold', border: '1px solid'}}}>No</Button>
          <Button onClick={handleIncompleteUserStoriesConfirmation} sx={{color: theme.palette.text.secondary, fontSize: '1rem', '&:hover': { color: theme.palette.text.secondary, fontWeight: 'bold', border: '1px solid'}}}>
            Yes
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

export default CurrentSprint;