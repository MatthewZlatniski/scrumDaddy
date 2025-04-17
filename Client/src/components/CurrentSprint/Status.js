import Task from './Task';
import styled from 'styled-components';
import TaskDetailDialog from '../Backlog/TaskDetailDialog';
import { useState } from 'react';
import { Typography } from '@mui/material';
import { useTheme } from '@mui/system';

const LaneWrapper = styled.div`
  text-align: left;
  padding: 0;
  border-radius: 20px;
  border: 2px solid white;
  min-height: 50vh;
  width: 20vw;
  background: ${({ title }) => {
    switch (title) {
      case 'To Do':
        return '#C58BFF';
      case 'In Progress':
        return '#9D80FF';
      case 'Done':
        return '#00B2FF'; 
      case 'Review':
        return '#5499FF';
      default:
        return 'lightGray';
    }
  }};


  @media (max-width: 768px) {
    margin-bottom: 5%;
  }
`;

const Title = styled.h2`
  width: 100%;
  padding-bottom: 10px;
  text-align: center;
  color: white;
  border-bottom: 3px solid white;
`;

function Status({
  laneId,
  title,
  loading,
  error,
  tasks,
  onDragStart,
  onDragOver,
  onDrop,
}) {

    const [openTaskDialog, setOpenTaskDialog] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);

    const handleOpenTaskDialog = (task) => {
        setSelectedTask(task);
        setOpenTaskDialog(true);
    };

    const theme = useTheme();

  return (
    <LaneWrapper title={title} style={{borderColor: theme.palette.background.default}} onDragOver={onDragOver} onDrop={(e) => onDrop(e, laneId)}>

      <Title style={{ borderBottom: '3px solid white', fontSize: '1.5rem', borderColor: theme.palette.background.default, color: theme.palette.background.default}}>{title}</Title>

      {loading || error ? (
        <span>{error || 'Loading...'}</span>
      ) : (
        tasks.map((task) => (
          <Task
            key={task.id}
            task={task}
            onDragStart={onDragStart}
            onClick={() => handleOpenTaskDialog(task)}
          />
        ))
      )}
      {selectedTask && (
        <TaskDetailDialog
          open={openTaskDialog}
          onClose={() => setOpenTaskDialog(false) && setSelectedTask(null)}
          task={selectedTask}
          sprint={true}
        />
      )}
    </LaneWrapper>

  );
}

export default Status;