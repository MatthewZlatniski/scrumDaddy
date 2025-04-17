import React, { useState, useEffect } from 'react';
import { Grid, Box, Button, TextField, List, ListItem, ListItemText, Typography, Paper, MenuItem,  Dialog, DialogTitle, DialogContent, DialogActions, Slider } from '@mui/material';
import Axios from 'axios'; 
import Sidebar from '../sharedComponents/Sidebar';
import TopBar from '../sharedComponents/Topbar';
import { useTheme } from '@mui/system';
import CircularProgress from '@mui/material/CircularProgress';

function CollaboratorsPage({ onUpdateTheme }) {
  const [owners, setOwners] = useState([]);
  const [scrumMasters, setScrumMasters] = useState([]);
  const [developers, setDevelopers] = useState([]);
  const [newCollaboratorEmail, setNewCollaboratorEmail] = useState('');
  const [selectedRole, setSelectedRole] = useState('developer'); // Default role is 'dev'
  const [errorStatus, setErrorStatus] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [reviewsCompleted, setReviewsCompleted] = useState(0);
  const [currentSprint, setCurrentSprint] = useState(0);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRatings, setReviewRatings] = useState({});
  const [isReviewFormOpen, setIsReviewFormOpen] = useState(false);
  const [reviewFeedback, setReviewFeedback] = useState('');
  //get the current user username to make sure to not include on peer review form
  const currUser = sessionStorage.getItem('user');


  // Function to open modal and initialize ratings
  const openReviewModal = () => {
    setShowReviewModal(true);
    // Initialize or reset ratings
    const initialRatings = {};
    [...owners, ...scrumMasters, ...developers].forEach(collaborator => {
      initialRatings[collaborator.username] = 3; // Default rating
    });
    setReviewRatings(initialRatings);
  };

  // Handle change in rating
  const handleRatingChange = (username, newValue) => {
    setReviewRatings(prevRatings => ({
      ...prevRatings,
      [username]: newValue,
    }));
  };

  const submitReviews = async () => {
    console.log('Review Ratings:', reviewRatings);

    // Prepare review data to send to the server
    const reviewData = {
      sprintNumber: reviewsCompleted + 1,
      reviews: reviewRatings,
      projectID: sessionStorage.getItem('currentProjectID'),
    };

    try {
      const authToken = sessionStorage.getItem('authToken');
      const response = await Axios.post('http://localhost:3001/saveReviews', reviewData, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (response.data.success) {
        console.log('Reviews saved successfully');
        const incrementedReviewsCompleted = reviewsCompleted + 1;
        setReviewsCompleted(incrementedReviewsCompleted);
        setShowReviewModal(false); // Close modal after submission
        setIsReviewFormOpen(false);
        setReviewRatings({});
      } else {
        console.error('Failed to save reviews:', response.data.message);
        // Handle error if needed
      }
    } catch (error) {
      console.error('Error saving reviews:', error);
      // Handle error if needed
    }
  };

  const handleAddCollaborator = async (e) => {
    // Add validation or further logic if needed
    let role = 1;
    if (selectedRole === 'developer') {
      role = 1;
    }
    else if (selectedRole === 'owner') {
      role = 4;
    }
    else {
      role = 2;
    }

    const collaborator = {
      collaboratorEmail: newCollaboratorEmail,
      projectID: sessionStorage.getItem('currentProjectID'),
      permission: role,
    };
    // Use the collaborator object or send it to the server as needed
    console.log('Adding collaborator:', collaborator);

    // check that it's valid before adding it
    const authToken = sessionStorage.getItem('authToken');
    const response = await Axios.post('http://localhost:3001/addCollab', collaborator, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    if(response.data.success) {
      console.log("Server responded with a message:", response.data.message);
      const onlineStatus = 0; // Default to red dot
      switch (role) {
        case 1: // Developer
          setDevelopers([...developers, { username: response.data.username, onlineStatus }]);
          break;
        case 2: // Scrum Master
          setScrumMasters([...scrumMasters, { username: response.data.username, onlineStatus }]);
          break;
        case 4: // Owner
          setOwners([...owners, { username: response.data.username, onlineStatus }]);
          break;
      }
      setNewCollaboratorEmail('');
      setSelectedRole('developer')
      setErrorStatus('');
    } else {
      console.log("Server responded with a message:", response.data.message);
      setErrorStatus(response.data.message);
    }
  };

  const fetchCollaborators = async () => {
    setIsLoading(true);
    try {
      const authToken = sessionStorage.getItem('authToken');
      const selectedProjectID = sessionStorage.getItem('currentProjectID');
      const response = await Axios.post(
        'http://localhost:3001/getCollaborators',
        { selectedProjectID },
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );
  
      if (response.data.success) {
        const { owners, scrumMasters, developers } = response.data;
        setOwners(owners.map(owner => ({ ...owner, onlineStatus: parseInt(owner.onlineStatus) })) || []);
        setScrumMasters(scrumMasters.map(master => ({ ...master, onlineStatus: parseInt(master.onlineStatus) })) || []);
        setDevelopers(developers.map(developer => ({ ...developer, onlineStatus: parseInt(developer.onlineStatus) })) || []);
        setReviewsCompleted(response.data.reviewsCompleted);
        setCurrentSprint(response.data.currentSprint);
        setErrorStatus('');
      } else {
        setErrorStatus(response.data.message);
      }
    } catch (error) {
      console.error('Error fetching collaborators:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCollaborators();
  }, []);


  const theme = useTheme();

  const renderCollaboratorCategory = (categoryTitle, categoryList, categoryColor) => (
    <Paper elevation={3} sx={{ p: 2, mb: 2, backgroundColor: categoryColor, width: '30%', mr: 2 }}>
      <Typography variant="h6" gutterBottom>
        {categoryTitle}
      </Typography>
      <List>
        {categoryList.map((collaborator, index) => (
          <ListItem key={index}>
            <ListItemText
              primary={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography>{collaborator.username}</Typography>
                  <Box
                    sx={{
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      marginLeft: 1,
                      backgroundColor: collaborator.onlineStatus === 1 ? 'green' : 'red',
                    }}
                  />
                </Box>
              }
            />
          </ListItem>
        ))}
      </List>
    </Paper>
  );

  return (
    <div>
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1100,
        }}
      >
        <TopBar
          completed={30}
          inProgress={40}
          title="Collaborators"
          onUpdateTheme={onUpdateTheme}
        />
      </Box>
      <Box sx={{ display: 'flex', mt: 10 }}>
        <Sidebar />
        <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex' }}>
                {isLoading ? (
                  <CircularProgress color="secondary" />
                ) : (
                  <>
                    {renderCollaboratorCategory('Owners', owners, '#C58BFF')}
                    {renderCollaboratorCategory('Scrum Masters', scrumMasters, '#7D9FFF')}
                    {renderCollaboratorCategory('Developers', developers, '#00B2FF')}
                  </>
                )}
              </Box>
              <TextField
                label="New Collaborator Email"
                variant="outlined"
                fullWidth
                value={newCollaboratorEmail}
                onChange={(e) => setNewCollaboratorEmail(e.target.value)}
                sx={{ mt: 2 }}
              />
              <Box sx={{ display: 'flex', mt: 2 }}>
                <TextField
                  select
                  label="Role"
                  variant="outlined"
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  sx={{ minWidth: 120, marginRight: 2, color: 'black' }}
                >
                  <MenuItem value="owner" style={{ color: 'black' }}>Owner</MenuItem>
                  <MenuItem value="scrumMaster" style={{ color: 'black' }}>Scrum Master</MenuItem>
                  <MenuItem value="developer" style={{ color: 'black' }}>Developer</MenuItem>
                </TextField>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleAddCollaborator}
                  sx={{ bgcolor: theme.palette.secondary.main }}
                >
                  Add Collaborator
                </Button>
              </Box>
              {errorStatus && (
                <Typography color="error" sx={{ mt: 2 }}>
                  {errorStatus}
                </Typography>
              )}
  
              {/* Conditional rendering for the complete review button */}
              {(reviewsCompleted + 1 < currentSprint) && (
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => setIsReviewFormOpen(true)}
                  sx={{ mt: 5, bgcolor: "green", color: 'white', fontWeight: "bold" }}
                >
                  Complete Review for Sprint {reviewsCompleted + 1}
                </Button>
              )}
  
              {/* Conditional rendering for the review form */}
              <Dialog open={isReviewFormOpen} onClose={() => setIsReviewFormOpen(false)} maxWidth="md" fullWidth>
  <DialogTitle>Review Collaborators for Sprint {reviewsCompleted + 1}</DialogTitle>
  <DialogContent>
    {[...owners, ...scrumMasters, ...developers].filter(collab => collab.username !== currUser).map((collaborator, index) => (
      <Box key={index} sx={{ mb: 2 }}>
        <Typography>{collaborator.username}</Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
          {[1, 2, 3, 4, 5].map((rating) => (
            <Button
              key={rating}
              variant={reviewRatings[collaborator.username] === rating ? "contained" : "outlined"}
              color="primary"
              onClick={() => handleRatingChange(collaborator.username, rating)}
              sx={{
                mx: 0.5,
                backgroundColor: reviewRatings[collaborator.username] === rating ? '#1976d2' : 'rgba(0, 0, 255, 0.2)',
                color: reviewRatings[collaborator.username] === rating ? '#ffffff' : undefined,
              }}
            >
              {rating}
            </Button>
          ))}
        </Box>
      </Box>
    ))}
  </DialogContent>
  <DialogActions>
  <Button onClick={() => setIsReviewFormOpen(false)} variant="outlined" color="primary" style={{ color: '#fff', backgroundColor: '#f50057' }}>
    Cancel
  </Button>
  <Button onClick={submitReviews} variant="contained" color="primary" style={{ color: '#fff', backgroundColor: '#1976d2' }}>
    Submit Reviews
  </Button>
</DialogActions>
</Dialog>


            </Grid>
          </Grid>
        </Box>
      </Box>
    </div>
  );  
}

export default CollaboratorsPage; 