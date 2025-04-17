import React from 'react';
import { Box, Typography, Avatar } from '@mui/material';


const getRandomColor = () => {

    // Randomized the color right now, maybe we can save a random color to each user to look better
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  };



function Task({ task, onDragStart, onClick }) {
    const avatarColor = getRandomColor();
  return (
    <Box
      sx={{
        background: 'white',
        padding: '20px',
        borderRadius: '20px',
        margin: '0% 2.5% 5% 2.5%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        cursor: 'grab', 
        // '&:hover': {
        //   cursor: 'grabbing',
        // },
      }}
      draggable
      onDragStart={(e) => onDragStart(e, task.id)}
      onClick={onClick}
    >
      <Typography variant="h6" sx={{ width: '100%', margin: 0, color: 'black' }}>
        {task.title}
      </Typography>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Typography
          sx={{
            fontSize: '12px',
          }}
        >
          {`#: ${task.id}`}
        </Typography>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <Typography variant="body2" sx={{ marginRight: '8px' }}>
            {`${task.originalEstimate}h`}
          </Typography>
          <Avatar sx={{ width: 24, height: 24, fontSize: '0.875rem', backgroundColor: avatarColor }}>
            {task.assigneeInitials}
          </Avatar>
        </Box>
      </Box>
    </Box>
  );
}

export default Task;
