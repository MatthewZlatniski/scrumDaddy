import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Navigate, useLocation } from 'react-router-dom';
import LoginPage from './components/LoginPage/LoginPage';
import Dashboard from './components/Dashboard/Dashboard';
import ProgressReport from './components/ProgressReport/ProgressReport';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import ProjectCalendar from './components/ProjectCalendar/ProjectCalendar';
import CurrentSprint from './components/CurrentSprint/CurrentSprint';
import Backlog from './components/Backlog/Backlog';
import Verification from './components/VerificationPage/VerificationPage';
import DesignDocuments from './components/DesignDocuments/DesignDocuments';
import CollaboratorsPage from './components/Collaborators/CollaboratorsPage';
import ProductBacklog from './components/ProductBacklog/ProductBacklog';
import ForgotPassword from './components/PasswordReset/ForgotPassword';
import ChatBoard from './components/ChatBoard/ChatBoard';
import Axios from 'axios';
import ResetPassword from './components/PasswordReset/ResetPassword';



const ProtectedRoute = ({ children }) => {
    const location = useLocation();
    const authToken = sessionStorage.getItem('authToken');

    if (!authToken) {
        // Redirect them to the /login page, but save the current location they were
        // trying to go to when they were redirected. This allows us to send them
        // along to that page after they log in, which is a nicer user experience
        // than dropping them off on the home page.
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return children;
};


// Dark mode theme
const darkTheme = createTheme({
  palette: {
    text: {
      primary: '#fff',
      secondary: '#C58BFF',
      tertiary: '#C58BFF',
    },
    background: {
      default: '#1a1a1a',
    },
    primary: {
      main: '#333333',
    },
    secondary: {
      main: '#C58BFF',
    },
  },
});

// light mode theme
const lightTheme = createTheme({
  palette: {
    text: {
      primary: '#000',
      secondary: '#00B2FF',
      tertiary: '#00B2FF',
    },
    background: {
      default: '#fff',
    },
    primary: {
      main: '#eeeeee',
    },
    secondary: {
      main: '#00B2FF',
    },
  },
});

function App() {

  // Check if user theme is stored in session storage
  const storedTheme = sessionStorage.getItem('theme');
  // Set the initial theme based on stored value or use default
  const [userTheme, setUserTheme] = useState(storedTheme || 'light');

  useEffect(() => {
    const fetchUserTheme = async () => {
      const authToken = sessionStorage.getItem('authToken');

      if (authToken) {
        try {
          const response = await Axios.get('http://localhost:3001/userTheme', {
            headers: {
              Authorization: `Bearer ${authToken}`,
            },
          });

          console.log("theme: ", response.data.userTheme)

          setUserTheme(response.data.userTheme);
        } catch (error) {
          console.error('Error fetching user theme:', error);
        }
      }
    };

    fetchUserTheme();

  }, []);

  const updateTheme = (newTheme) => {
    setUserTheme(newTheme);
  };

  return (
    <ThemeProvider theme={userTheme === 'light' ? lightTheme : darkTheme}>
      <CssBaseline />
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage onUpdateTheme={updateTheme}/>} />
        <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard onUpdateTheme={updateTheme} />
            </ProtectedRoute>
          } />
        <Route path="/progressreport" element={
            <ProtectedRoute>
              <ProgressReport onUpdateTheme={updateTheme} />
            </ProtectedRoute>
          } />
        <Route path="/backlog" element={
            <ProtectedRoute>
              <Backlog onUpdateTheme={updateTheme} />
            </ProtectedRoute>
          } />
        <Route path="/sprint" element={
            <ProtectedRoute>
              <CurrentSprint onUpdateTheme={updateTheme} />
            </ProtectedRoute>
          } />
        <Route path="/projectcalendar" element={
            <ProtectedRoute>
              <ProjectCalendar onUpdateTheme={updateTheme} />
            </ProtectedRoute>
          } />
        <Route path="/verification" element={

              <Verification />
          } />
        <Route path="/designdocuments" element={
            <ProtectedRoute>
              <DesignDocuments onUpdateTheme={updateTheme} />
            </ProtectedRoute>
          } />
        <Route path="/collaborators" element={
            <ProtectedRoute>
              <CollaboratorsPage onUpdateTheme={updateTheme} />
            </ProtectedRoute>
          } />
        <Route path="/productbacklog" element={
            <ProtectedRoute>
              <ProductBacklog onUpdateTheme={updateTheme} />
            </ProtectedRoute>
          } />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/chatboard/:projectName" element={
            <ProtectedRoute>
              <ChatBoard onUpdateTheme={updateTheme} />
            </ProtectedRoute>
          } />
        <Route path="/" element={<LoginPage onUpdateTheme={updateTheme}/>} />
      </Routes>
    </Router>
    </ThemeProvider>
  );
}

export default App;
