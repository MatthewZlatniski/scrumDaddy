import React from 'react';
import { Grid, Box } from '@mui/material';
import Sidebar from '../sharedComponents/Sidebar';
import TopBar from '../sharedComponents/Topbar';
import BurndownChart from './BurndownChart';

function ProgressReport({ onUpdateTheme }) {
  return (
    <div>
      <Box sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1100,
      }}>   
      <TopBar completed={30} inProgress={40} title="Progress Report" onUpdateTheme={onUpdateTheme}/>
      </Box>
      <Box sx={{ display: 'flex', mt: 10 }}>
        <Sidebar />


        {/* Grid container for the dashboard content */}
        <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
            <BurndownChart />
            </Grid>
            <Grid item xs={12} md={6}>
              
            </Grid>
            <Grid item xs={12} md={6}>
            </Grid>
            <Grid item xs={12} md={6}>
            </Grid>
          </Grid>
        </Box>
      </Box>
    </div>
  );
}


export default ProgressReport;