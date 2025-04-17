import React, { useState, useEffect } from 'react';
import { Box, Grid, Typography, Card, Chip, Avatar, CardContent, Button, IconButton, Menu, MenuItem} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { Tooltip } from '@mui/material';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import Sidebar from '../sharedComponents/Sidebar';
import TopBar from '../sharedComponents/Topbar';
import TaskDetailDialog from './TaskDetailDialog';
import CreateTask from './CreateTask';
import { useTheme } from '@mui/system';
import Axios from 'axios';

function Backlog({ onUpdateTheme }) {
  const [openTaskDialog, setOpenTaskDialog] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [openCreationDialog, setOpenCreationDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const theme = useTheme();

  const storedProjectID = sessionStorage.getItem('currentProjectID');


  // tasks array, Get the tasks from the server and set them to tasks.
  const [tasks, setTasks] = useState([]);

  const sprintTasks = tasks.filter(task => task.status === 'Sprint');
  const backlogTasks = tasks.filter(task => task.status === 'Backlog');

  const fetchTasks = async (e) => {
    try {
        setLoading(true);
        const projectID = sessionStorage.getItem('currentProjectID');
        console.log("list tasks for :", projectID);

        const response = await Axios.post('http://localhost:3001/listTask', {projectID}, {
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem('authToken')}`,
          },
        });

        if (response.data.success) {
          console.log("returned tasks: ", response.data.tasks);
          setTasks(response.data.tasks);
        }
    } catch (error) {
      console.error('Error fetching task list:', error);
      setError('Error fetching task list. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (storedProjectID) {
      fetchTasks();
    }
  }, []);

  const handleOpenTaskDialog = (task) => {
    console.log(task);
    setSelectedTask(task);
    setOpenTaskDialog(true);
  };

  const handleCloseTaskDialog = (newTask) => {
    console.log(newTask);
    if (newTask) {
      // Update the selected task with the newTask
      setSelectedTask(newTask);

      // You can also update the tasks array if needed
      const updatedTasks = tasks.map((task) =>
        task.id === newTask.id ? newTask : task
      );
      setTasks(updatedTasks);
    }
    setOpenTaskDialog(false);
    setSelectedTask(null);
  };

  const handleAddTaskClick = () => {
    setOpenCreationDialog(true);
  };

  const handleCloseCreationDialog = () => {
    setOpenCreationDialog(false);
  };


  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const [openMenuTaskId, setOpenMenuTaskId] = useState(null);


  const handleClick = (event, taskId) => {
    event.stopPropagation();
    setOpenMenuTaskId(taskId);
  };

  const handleClose = async(event, action, task) => {
    event.stopPropagation();
    setOpenMenuTaskId(null);

    if (action === 'edit') {
        handleOpenTaskDialog(task);
    } else if (action === 'move') {
        // Move the task to the other lane
        // also might have to update server
        const newStatus = task.status === 'Backlog' ? 'Sprint' : 'Backlog';
        const newLane = task.status === 'Backlog' ? 'To Do' : 'Backlog';
        try {
          const response = await Axios.post(
            'http://localhost:3001/moveTask',
            {
              taskId: task.id,
              newStatus,
              newLane,
            },
            {
              headers: {
                Authorization: `Bearer ${sessionStorage.getItem('authToken')}`,
              },
            }
          );

          if (response.data.success) {
            const updatedTask = { ...task, status: newStatus, lane: newLane };
            const updatedTasks = tasks.map(t => (t.id === task.id ? updatedTask : t));
            setTasks(updatedTasks);
          } else {
            console.error('Error moving task:', response.data.message);
          }
        } catch (error) {
          console.error('Error moving task:', error);
        }
    } else if (action === 'remove') {
      // Remove the task from the list
      const projectIDPass = sessionStorage.getItem('currentProjectID');
      try {
        const response = await Axios.post(
          'http://localhost:3001/removeTask',
          {
            taskId: task.id,
            assignedUser: task.assignees,
            taskTitle: task.title,
            projectID: projectIDPass,
          },
          {
            headers: {
              Authorization: `Bearer ${sessionStorage.getItem('authToken')}`,
            },
          }
        );

        if (response.data.success) {
          // If the remove operation is successful, update the tasks locally
          const updatedTasks = tasks.filter((t) => t.id !== task.id);
          setTasks(updatedTasks);
        } else {
          console.error('Error removing task:', response.data.message);
        }
      } catch (error) {
        console.error('Error removing task:', error);
      }
    }
  };

  // Render function for tasks to avoid repeating code
const renderTasks = (taskList, sectionTitle) => (
    <>
      <Typography variant="h4" gutterBottom sx={{ mt: 4, mb: 2 }}>
        {sectionTitle}
      </Typography>
      <Grid container spacing={2}>
        {taskList.map((task, index) => (
          <Grid item xs={12} key={task.id}>
            <Card 
              sx={{ 
                display: 'flex', 
                justifyContent: 'start',
                alignItems: 'center', 
                padding: '8px 16px',
                margin: '0px 0',
                background: 'grey', 
                color: 'white', 
                cursor: 'pointer' 
              }}
              onClick={() => handleOpenTaskDialog(task)}
            >
              <CardContent sx={{ flex: '1 1 auto', padding: '0 16px' }}>
                <Typography variant="subtitle1" noWrap>
                  {task.title}
                </Typography>
              </CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, marginLeft: 'auto' }}>
                <Chip label={task.lane} size="small" sx={{ background: 'lightgrey', color: 'black' }} />
                <Typography variant="body2" sx={{ marginLeft: '8px' }}>
                  {task.originalEstimate}h
                </Typography>
                <Avatar sx={{ bgcolor: 'orange' }}>{task.assigneeInitials}</Avatar>
                <IconButton
                    aria-label="more"
                    aria-controls={`task-menu-${task.id}`}
                    aria-haspopup="true"
                    onClick={(event) => {
                        setAnchorEl(event.currentTarget); 
                        handleClick(event, task.id); 
                    }}
                    sx={{ color: 'white', marginLeft: 'auto' }}
                >
                    <MoreVertIcon />
                </IconButton>
                <Menu
                  id={`task-menu-${task.id}`}
                  anchorEl={anchorEl}
                  keepMounted
                  open={openMenuTaskId === task.id}
                  onClose={handleClose}
                >
                  {/* You can add logic here to dynamically create MenuItems based on the task's state or other criteria */}
                  <MenuItem sx={{color: 'black'}} onClick={(event) => { handleClose(event, 'edit', task); }}>Edit</MenuItem>
                  <MenuItem sx={{color: 'black'}} onClick={(event) => { handleClose(event, 'remove', task); }}>Remove</MenuItem>
                </Menu>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>
    </>
  );

  return (
    <div>
      <Box sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1100,
      }}>
        <TopBar title="Backlog" onUpdateTheme={onUpdateTheme} />
      </Box>
      <Box sx={{ display: 'flex', mt: 10 }}>
        <Sidebar />
        <Box component="main" sx={{ flexGrow: 1, p: 3, mt: 10 }}>
          {storedProjectID ? (
            <>
              {renderTasks(sprintTasks, "Current Sprint")}
              <Box sx={{ mt: 4 }}>
                <Typography variant="h4" gutterBottom>Backlog</Typography>
                {renderTasks(backlogTasks)}
                <Box sx={{ display: 'flex', justifyContent: 'flex-start', mt: 2 }}>
                  <Tooltip title="Create new task">
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={<AddCircleIcon />}
                      onClick={handleAddTaskClick}
                    >
                      Create Task
                    </Button>
                  </Tooltip>
                </Box>
              </Box>
            </>
          ) : (
            <Typography variant="h5" color="error" sx={{ mt: 4, ml: 4 }}>
              Please select a project first.
            </Typography>
          )}
        </Box>
      </Box>
      {/* Task Detail Dialog */}
      {selectedTask && (
        <TaskDetailDialog
          open={openTaskDialog}
          onClose={handleCloseTaskDialog}
          task={selectedTask}
        />
      )}
      <CreateTask
        open={openCreationDialog}
        onClose={handleCloseCreationDialog}
      />

    </div>
  );
}

export default Backlog;
