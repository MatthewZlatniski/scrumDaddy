import React, {useState, useEffect} from 'react';
import { Box } from '@mui/material';
import Axios from 'axios';


function ProgressBar() {
  const [completed, setCompleted] = useState(0);
  const [inProgress, setInProgress] = useState(0);
  //const [todo, setTodo] = useState(0);
  const [totalTasks, setTotalTasks] = useState(0);
 
  //query every x seconds
  useEffect(() => {
      fetchData(); // Fetch data initially
      const interval = setInterval(fetchData, 5000); // Check for new comments every 5 seconds
      return () => clearInterval(interval); // when it returns clear the
  }, []);


  const fetchData = async () => {
    try {
      const projectId = sessionStorage.getItem('currentProjectID'); //will call in the function below
      const response = await Axios.get(`http://localhost:3001/getProgress`, {
        params: {
          projectID: projectId, // Add this line to include taskId as a URL parameter
        },
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem('authToken')}`,
        },
      });
      //will get in progress, completed, todo and totaltasks so it will be like response.data.todo
      if (response.data.success) {
        setCompleted(response.data.completed);
        setInProgress(response.data.inProgress);
        //setTodo(response.data.todo);
        setTotalTasks(response.data.totalTasks);
      } else {
        console.error('Error fetching progress data:', response.data.message);
      }
    } catch (error) {
      console.error('Error fetching progress data:', error);
    }
  };




  //above need to get completed, inProgress, todo
  //let totalTasks = completed + inProgress + todo;
  let completedPercent = totalTasks > 0 ? (completed / totalTasks) * 100 : 0;
  let inProgressPercent = totalTasks > 0 ? (inProgress / totalTasks) * 100 : 0;
  let separatorWidth = 1;


  const showCompletedSeparator = completed > 0 && inProgress > 0;


  return (
    <Box sx={{
      width: '100%',
      height: 10,
      backgroundColor: '#e0e0e0',
      borderRadius: '4px',
      position: 'relative',
      display: 'flex',
    }}>
      {/* Completed section */}
      <Box sx={{
        height: '100%',
        width: `${completedPercent}%`,
        backgroundColor: '#4caf50',
        borderRadius: '4px 0 0 4px',
      }} />


      {/* Separator after the completed section */}
      {showCompletedSeparator && (
        <Box sx={{
          height: '100%',
          width: `${separatorWidth}px`,
          backgroundColor: 'black',
        }} />
      )}


      {/* In progress section */}
      <Box sx={{
        height: '100%',
        width: `${inProgressPercent}%`,
        backgroundColor: '#ff9800',
        borderRadius: showCompletedSeparator ? '0' : '4px 0 0 4px',
      }} />


      {/* Separator after the completed section */}
      {showCompletedSeparator && (
        <Box sx={{
          height: '100%',
          width: `${separatorWidth}px`,
          backgroundColor: 'black',
        }} />
      )}
    </Box>
  );
}


export default ProgressBar;



