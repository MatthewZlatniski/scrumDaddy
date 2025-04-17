import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Paper, Grid, MenuItem, Select } from '@mui/material';
import { Dialog, DialogActions, DialogContent, DialogTitle, TextField, Switch, FormControlLabel } from '@mui/material';
import { DateTimePicker,DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFnsV3'
import Sidebar from '../sharedComponents/Sidebar';
import TopBar from '../sharedComponents/Topbar';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { ThemeProvider, createTheme, useTheme } from '@mui/material/styles';
import './ProjectCalendar.css';
import { v4 as uuidv4 } from 'uuid';
import Axios from 'axios';


const localizer = momentLocalizer(moment);



function ProjectCalendar({ onUpdateTheme }) {
    const theme = useTheme();
    const theme1 = createTheme({theme});
  const [events, setEvents] = useState([]);
  const [open, setOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [eventDetails, setEventDetails] = useState({
    title: '',
    desc: '',
    allDay: false,
    start: new Date(),
    end: new Date(),
    isRecurring: false,
    recurrence: 'daily',
    id:'',
    recurrenceID: '',
  });

  useEffect(() => {
    console.log(selectedEvent);
    if (selectedEvent) {
      setEventDetails({
        title: selectedEvent.title,
        desc: selectedEvent.desc,
        allDay: selectedEvent.allDay,
        start: selectedEvent.start,
        end: selectedEvent.end,
        isRecurring: selectedEvent.isRecurring || false,
        recurrence: selectedEvent.recurrence || 'daily',
      });
    }
  }, [selectedEvent]);

  useEffect(() => {
    fetchStoredEvents();
  }, []);

  const fetchStoredEvents = async() => {
    const projectID = sessionStorage.getItem('currentProjectID');
    try {
      // Make a POST request to mark messages as read
      const response = await Axios.post('http://localhost:3001/fetchEvents', {
        projectID
      }, {
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem('authToken')}`,
        },
      });

      if (response.data.success) {
        if (response.data.storedEvents) {
          setEvents(response.data.storedEvents);
          console.log("stored events", response.data.storedEvents);
        }
      } else {
        console.error('Error fetching events', response.data.message);
      }
    } catch (error) {
      console.error('Error fetching events', error);
    }
  };

  const handleSelectEvent = (event) => {
    setSelectedEvent(event);
    handleOpen();
  };

  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    setSelectedEvent(null);
    setEventDetails({
      title: '',
      desc: '',
      allDay: false,
      start: new Date(),
      end: new Date(),
      isRecurring: false,
      recurrence: 'daily',
    });
  };

  const handleRecurringToggle = (e) => {
    setEventDetails({ 
      ...eventDetails, 
      isRecurring: e.target.checked,
      recurrence: e.target.checked ? eventDetails.recurrence : ''
    });
  };


  const handleAllDayToggle = (e) => {
    setEventDetails({...eventDetails, allDay: e.target.checked});
  };


  // Handle date selection
  const handleDateSelect = ({ start, end }) => {
    const title = window.prompt('New Event name');
    if (title) {
      setEvents([
        ...events,
        {
          start,
          end,
          title,
        },
      ]);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEventDetails({...eventDetails, [name]: value});
  };

  const handleDateChange = (newValue, key, allDay, isRecurring) => {
    if (allDay) {
        setEventDetails({ ...eventDetails, start: newValue, end: newValue });
    }
    else {
        setEventDetails({ ...eventDetails, [key]: newValue });
    }
  };


  // ** ADD
  const handleAddEvent = (isRecurring) => {
    let newEvents = [];
    if (isRecurring) {
      console.log("it is recurring");
      newEvents = recurringNewEvents();
    } else {
      newEvents = [{ ...eventDetails, id: uuidv4() }];
    }
    console.log(newEvents);
    handleDatabaseAdd(newEvents);
  };

  const handleDatabaseAdd = async(newEvents) => {
    const projectID = sessionStorage.getItem('currentProjectID');
    try {
      // Make a POST request to mark messages as read
      const response = await Axios.post('http://localhost:3001/addEvents', {
        projectID,
        newEvents
      }, {
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem('authToken')}`,
        },
      });

      if (response.data.success) {
        setEvents([...events, ...newEvents]);
        console.log(newEvents);
        handleClose();
      } else {
        console.error('Error fetching events', response.data.message);
      }
    } catch (error) {
      console.error('Error fetching events', error);
    }
  };

  const recurringNewEvents = () => {
    let lastevent = moment(events[events.length - 1].end)
    const newEvents = [];
    const recurrenceID = uuidv4();
    let currentDate = moment(eventDetails.start);
    while (currentDate.isBefore(lastevent)) {
        let newStart = currentDate.clone();
        let newEnd = moment(eventDetails.end).add(currentDate.diff(eventDetails.start, 'days'), 'days');

        if (newStart.isAfter(lastevent)) break;

        newEvents.push({
            ...eventDetails,
            start: newStart.toDate(),
            end: newEnd.toDate(),
            id: uuidv4(),
            recurrenceID,
        });

        switch (eventDetails.recurrence) {
            case 'daily':
                currentDate.add(1, 'days');
                break;
            case 'workday':
                do {
                    currentDate.add(1, 'days');
                } while (currentDate.isoWeekday() > 5);
                break;
            case 'weekly':
                currentDate.add(1, 'weeks');
                break;
            case 'monthly':
                currentDate.add(1, 'months');
                break;
            default:
                currentDate.add(1, 'days');
        }
    }

    return newEvents;
};

// ** EDIT
  // Handler for updating the event
  const handleUpdateEvent = () => {

    if (!selectedEvent.isRecurring && !eventDetails.isRecurring) {
        const updatedEvents = events.map((evt) => {
            if (evt.id === selectedEvent.id) {
                if (evt.allDay) {
                    return { ...evt, ...eventDetails, end: eventDetails.start };
                }
                return { ...evt, ...eventDetails };
            }
            return evt;
            });

            handleEventUpdateNotRecurring(updatedEvents);

            return;
    }

    if (selectedEvent.isRecurring && eventDetails.isRecurring) {
        // both are recurring
        const updatedEvents = events.filter((event) => {
            return event.recurrenceID !== selectedEvent.recurrenceID;
        });
        const newEvents = recurringNewEvents();
        setEvents([...updatedEvents, ...newEvents]);
        handleClose();
        setSelectedEvent(null);
        return;
    }

    // if single turned to recurring
    if (!selectedEvent.isRecurring && eventDetails.isRecurring) {
        const updatedEvents = events.filter((event) => {
            return event.id !== selectedEvent.id;
        });
        const newEvents = recurringNewEvents();
        setEvents([...updatedEvents, ...newEvents]);
        handleClose();
        setSelectedEvent(null);
        return;
    }

    // if recurring turned to single
    if (selectedEvent.isRecurring && !eventDetails.isRecurring) {
        const updatedEvents = events.filter((event) => {
            return event.recurrenceID !== selectedEvent.recurrenceID;
        });
        setEvents([...updatedEvents, { ...eventDetails, id: uuidv4() }]);
        handleClose();
        setSelectedEvent(null);
        return;
    }

    
  }

  const handleEventUpdateNotRecurring = async(updatedEvents) => {
  
    try {
      // Make a POST request to delete all recurring events
      const response = await Axios.post('http://localhost:3001/eventUpdateNotRecurring', {
        eventID: selectedEvent.eventID,
        eventDetails
      }, {
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem('authToken')}`,
        },
      });
  
      if (response.data.success) {
        setEvents(updatedEvents);
        handleClose(); 
        setSelectedEvent(null);
      } else {
        console.error('Error updating events', response.data.message);
      }
    } catch (error) {
      console.error('Error updating events', error);
    }
  }
  


  // ** DELETE
  const handleDeleteEvent = (eventToDelete) => {
    // Filter out the event to delete from the events array
    const updatedEvents = events.filter((event) => {
      return event.id !== eventToDelete.id;
    });
  
    handleDeleteDatabase(eventToDelete.eventID, updatedEvents);

  };

  const handleDeleteDatabase = async (eventID, updatedEvents)=> {
    try {
      // Make a POST request to mark messages as read
      const response = await Axios.post('http://localhost:3001/deleteEvent', {
        eventID
      }, {
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem('authToken')}`,
        },
      });

      if (response.data.success) {
        setEvents(updatedEvents);
        handleClose();
        setSelectedEvent(null); 
      } else {
        console.error('Error fetching events', response.data.message);
      }
    } catch (error) {
      console.error('Error fetching events', error);
    }
  };
  
  const handleDeleteAll = (selectedEvent) => {
    return () => {
      const updatedEvents = events.filter((event) => {
        return event.recurrenceID !== selectedEvent.recurrenceID;
      });
      handleDeleteAllRecurring(selectedEvent.recurrenceID);
      setEvents(updatedEvents);
      handleClose();
      setSelectedEvent(null);
    };
  }

  const handleDeleteAllRecurring = async (recurrenceID) => {
    try {
      // Make a POST request to delete all recurring events
      const response = await Axios.post('http://localhost:3001/deleteEventsByRecurrenceID', {
        recurrenceID
      }, {
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem('authToken')}`,
        },
      });
  
      if (response.data.success) {
        // Filter out the recurring events from the events array
        const updatedEvents = events.filter((event) => {
          return event.recurrenceID !== recurrenceID;
        });
        setEvents(updatedEvents);
        handleClose();
        setSelectedEvent(null);
      } else {
        console.error('Error deleting all recurring events', response.data.message);
      }
    } catch (error) {
      console.error('Error deleting all recurring events', error);
    }
  };


  return (
    <div>
      <Box sx={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1100 }}>
        <TopBar completed={30} inProgress={40} title="Project Calendar" onUpdateTheme={onUpdateTheme} />
      </Box>

      <Box sx={{ display: 'flex', mt: 10 }}>
        <Sidebar />

        <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
          <Paper elevation={3} sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
          <div>
      <Button variant="contained" color="primary" onClick={handleOpen} sx={{ml:'270px', marginBottom:'-45px'}}>
        Add Event
      </Button>
      <ThemeProvider theme={theme1}>
      <Dialog open={open} onClose={handleClose}
      sx={{
            '& label.Mui-focused': {
              color: 'text.primary', // Set focused label color
            },
            '& .MuiOutlinedInput-root': {
              '& fieldset': {
                borderColor: 'text.primary', // Set outline color
              },
              '&:hover fieldset': {
                borderColor: 'text.primary', // Set hover outline color
              },
              '&.Mui-focused fieldset': {
                borderColor: 'text.primary', // Set focused outline color
              },
            },
            '& .MuiInputBase-input': {
              color: 'text.primary', // Set input text color
            }, 
            '& .MuiDialog-paper': { backgroundColor: theme.palette.primary.main, color:theme.palette.text.primary, width: '45%', },
            mt:2,
          }}>
        {!selectedEvent ? <DialogTitle>Add New Event</DialogTitle> : <DialogTitle>Edit Event</DialogTitle>}
        <DialogContent>
          <TextField
            margin="dense"
            name="title"
            label="Event Title"
            type="text"
            fullWidth
            variant="outlined"
            value={eventDetails.title}
            onChange={handleChange}
          />
          <TextField
            margin="dense"
            name="desc"
            label="Description"
            type="text"
            fullWidth
            variant="outlined"
            value={eventDetails.desc}
            onChange={handleChange}
          />
          <FormControlLabel
            control={<Switch checked={eventDetails.allDay} onChange={handleAllDayToggle} sx={{
        '& .MuiSwitch-switchBase.Mui-checked': {
          color: theme.palette.secondary.main,
        },
        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
          backgroundColor: theme.palette.secondary.main,
        },
      }}/>
      }
            label="All Day"
          />
            <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Grid container spacing={2}>
      {eventDetails.allDay ? (
        <Grid item xs={12}>
          <DatePicker
            label="Date"
            value={eventDetails.start} // Assuming all-day event uses the start date only
            onChange={(newValue) => handleDateChange(newValue, 'start', eventDetails.allDay, eventDetails.isRecurring)}
            renderInput={(params) => <TextField {...params} fullWidth />}
            minDate={new Date()}
          />
        </Grid>
      ) : (
        <>
          <Grid item xs={6}>
            <DateTimePicker
              label="Start"
              value={eventDetails.start}
              onChange={(newValue) => handleDateChange(newValue, 'start', eventDetails.allDay, eventDetails.isRecurring)}
              renderInput={(params) => <TextField {...params} fullWidth={false} />}
              minDate={new Date()}
            />
          </Grid>
          <Grid item xs={6}>
            <DateTimePicker
              label="End"
              value={eventDetails.end}
              onChange={(newValue) => handleDateChange(newValue, 'end', eventDetails.allDay, eventDetails.isRecurring)}
              renderInput={(params) => <TextField {...params} fullWidth/>}
              minDate={eventDetails.start}
            />
          </Grid>
        </>
      )}
    </Grid>
            </LocalizationProvider>
            <FormControlLabel
    control={
      <Switch
        checked={eventDetails.isRecurring}
        onChange={(e) => setEventDetails({ ...eventDetails, isRecurring: e.target.checked })}
        name="isRecurring"
        sx={{
        '& .MuiSwitch-switchBase.Mui-checked': {
          color: theme.palette.secondary.main,
        },
        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
          backgroundColor: theme.palette.secondary.main,
        },
      }}
      />
    }
    label="Is Recurring"
  />
  
  {eventDetails.isRecurring && (
    <Select
      value={eventDetails.recurrence}
      onChange={(e) => setEventDetails({ ...eventDetails, recurrence: e.target.value })}
      name="recurrence"
      fullWidth
      variant="outlined"
      sx={{ mt: 2 }}
      MenuProps={{
          MenuListProps: {
            sx: {
              backgroundColor: theme.palette.primary.main,
              borderColor: theme.palette.secondary.main,
            },
          },
        }}
    >
      <MenuItem value="daily">
        Every Day
      </MenuItem>
      <MenuItem value="workday">Every Work Day (Mon-Fri)</MenuItem>
      <MenuItem value="weekly">Every Week</MenuItem>
      <MenuItem value="monthly">Every Month</MenuItem>
    </Select>
  )}
        </DialogContent>
        <DialogActions>
        {selectedEvent && selectedEvent.isRecurring ? <Button variant='contained' size='sm' color='error' onClick={handleDeleteAll(selectedEvent)}>Delete Recurring Events</Button> :''}
        {selectedEvent ? <Button
  variant="contained"
  color="error"
  onClick={() => handleDeleteEvent(selectedEvent)}
  sx={{
    // Additional styling
  }}
>
  Delete
</Button> :''}
  <Button 
    onClick={handleClose} 
    sx={{
      color: theme.palette.text.primary, 
      borderColor: theme.palette.secondary.main, 
      '&:hover': {
        backgroundColor: theme.palette.primary.dark,
      },
    }}
    >
    Cancel
  </Button>
  <Button onClick={selectedEvent ? handleUpdateEvent : () => handleAddEvent(eventDetails.isRecurring)}>
  {selectedEvent ? 'Save Changes' : 'Add'}
</Button>
</DialogActions>
      </Dialog>
      </ThemeProvider>
      <Calendar
        localizer={localizer}
        defaultDate={new Date()}
        events={events.map(event => ({
          ...event,
          start: moment(event.start).toDate(),
          end: moment(event.end).toDate()
        }))}
        defaultView="month"
        startAccessor="start"
        endAccessor="end"
        style={{ height: 500 }}
        onSelectEvent={handleSelectEvent}
      />
    </div>
          </Paper>
        </Box>
      </Box>
    </div>
  );
}

export default ProjectCalendar;
