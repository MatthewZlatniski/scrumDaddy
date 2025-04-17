import { useState, useRef, useEffect} from 'react';
import { Box, Typography, TextField, Button, Avatar, IconButton } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CancelIcon from '@mui/icons-material/Cancel';
import EditIcon from '@mui/icons-material/Edit';
import Axios from 'axios'; 



function UserInput({ user, setUser, label }) {
    const [inputValue, setInputValue] = useState(user || '');
    const [showInput, setShowInput] = useState(false);
    const inputRef = useRef(null);
    const [errorMessage, setErrorMessage] = useState('');

    // useEffect(() => {
    //     if (showInput && inputRef.current) {
    //         inputRef.current.focus();
    //     }
    // }, [showInput]);
  
    const handleAddUser = async () => {
      const authToken = sessionStorage.getItem('authToken');
      const selectedProjectID = sessionStorage.getItem('currentProjectID');
      console.log("PROJEC ID **** ", selectedProjectID);
      const response = await Axios.post(
        'http://localhost:3001/getCollaborators',
        { selectedProjectID },
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );
      // Extract developers from the response data
  const developers = response.data.developers;

  // Check if the entered name matches any developer's username
  const isDeveloper = developers.some(dev => dev.username === inputValue);
  
  if (isDeveloper) {
    setUser(inputValue);
    setShowInput(false);
    setErrorMessage('');
  } else {
    setErrorMessage('User is not a developer on this project.');
    setInputValue('');
    console.log("USER NOT ON PROJECT ***");
  }
};
  
    const handleRemoveUser = () => {
        setUser('');
        setInputValue('');
      };
  
    const handleShowInput = () => {
        setShowInput(true);
    };
  
    return (
      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1 }}>
        <Typography variant="body2">{label}:</Typography>
        {user && !showInput && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, bgcolor: 'action.hover', borderRadius: '16px', p: '4px 8px', mb: 1 }}>
            <Avatar sx={{ bgcolor: 'secondary.main', width: 24, height: 24 }}>{user.charAt(0).toUpperCase()}</Avatar>
            <Typography variant="body2">{user}</Typography>
            <IconButton size="small" onClick={handleRemoveUser}>
              <CancelIcon fontSize="small" />
            </IconButton>
          </Box>
        )}
        {showInput ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TextField
              size="small"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Enter name"
              sx={{ mr: 1 }}
            //   ref={inputRef}
            />
            <IconButton size="small" onClick={handleAddUser}>
              <AddIcon />
            </IconButton>
          </Box>
        ) : (
          <Button size="small" startIcon={user ? <EditIcon/> : <AddIcon/> } onClick={handleShowInput}>
         {user ? 'Change' : 'Add'}
          </Button>
        )}
        {errorMessage && (
        <Typography color="error" variant="caption" sx={{ ml: 1 }}>
          {errorMessage}
        </Typography>
      )}
      </Box>
    );
  }

  export default UserInput;