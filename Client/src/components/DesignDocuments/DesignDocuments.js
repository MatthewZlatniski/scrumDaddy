import React, { useState, useEffect, useRef } from 'react';
import { Grid, Box, Button, Tabs, Tab } from '@mui/material';
import axios from 'axios';
import Sidebar from '../sharedComponents/Sidebar';
import TopBar from '../sharedComponents/Topbar';
import { useTheme } from '@mui/system';

const templateFiles = {
  0: `${process.env.PUBLIC_URL}/Docs/Project_Charter_Template.docx`,
  1: `${process.env.PUBLIC_URL}/Docs/Design_Document_Template.docx`,
  2: `${process.env.PUBLIC_URL}/Docs/Product_Backlog_Template.docx`, 
  3: `${process.env.PUBLIC_URL}/Docs/Sprint_Planning_Template.docx`,
  4: `${process.env.PUBLIC_URL}/Docs/Retrospective_Template.docx`,
};

const defaultPdfFiles = {
  projectCharter: `${process.env.PUBLIC_URL}/Docs/Project_Charter_Template.pdf`,
  designDocument: `${process.env.PUBLIC_URL}/Docs/Design_Document_Template.pdf`,
  productBacklog: `${process.env.PUBLIC_URL}/Docs/Product_Backlog_Template.pdf`,
  planningDocument: `${process.env.PUBLIC_URL}/Docs/Sprint_Planning_Template.pdf`,
  retrospective: `${process.env.PUBLIC_URL}/Docs/Retrospective_Template.pdf`,
};

function DesignDocuments({ onUpdateTheme }) {
  const [pdfDisplayURL, setPdfDisplayURL] = useState(process.env.PUBLIC_URL + "/test.pdf");
  const [selectedTab, setSelectedTab] = useState(0);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);
  const [templateURL, setTemplateURL] = useState(templateFiles[0]);

  useEffect(() => {
    fetchUploadedPdf("projectCharter");
  }, []);

  const fetchUploadedPdf = async (documentType) => {
    const projectId = sessionStorage.getItem('currentProjectID');
    try {
      const response = await axios.get(`http://localhost:3001/downloadPdf/${projectId}/${documentType}`, {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('authToken')}`,
        },
        responseType: 'blob',
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setPdfDisplayURL(url);
    } catch (error) {
      if (error.response && error.response.status === 404) {
        console.error('Document not found:', error);
        // Display the default PDF when the document is not found
        setPdfDisplayURL(defaultPdfFiles[documentType]);
      } else {
        console.error('Error fetching uploaded PDF:', error);
      }
    }
  };

  

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  const handleUpload = async () => {
    if (selectedFile) {
      const formData = new FormData();
      formData.append('pdf', selectedFile);
      const projectId = sessionStorage.getItem('currentProjectID');
      formData.append('projectID', projectId);
      try {
        await axios.post(`http://localhost:3001/uploadPdf/${getDocumentType(selectedTab)}`, formData, {
          headers: {
            'Authorization': `Bearer ${sessionStorage.getItem('authToken')}`,
          },
        });
        setSelectedFile(null);
        fetchUploadedPdf(getDocumentType(selectedTab));
      } catch (error) {
        console.error('Error uploading PDF:', error);
      }
    }
  };

  const handleUploadButtonClick = () => {
    fileInputRef.current.click();
  };

  const handleTabChange = async (event, newValue) => {
    setSelectedTab(newValue);
    setTemplateURL(templateFiles[newValue]);
    await fetchUploadedPdf(getDocumentType(newValue));
  };

  const getDocumentType = (tabIndex) => {
    switch (tabIndex) {
      case 0:
        return 'projectCharter';
      case 1:
        return 'designDocument';
      case 2:
        return 'productBacklog';
      case 3:
        return 'planningDocument';
      case 4:
        return 'retrospective';
      default:
        return 'projectCharter';
    }
  };

  const theme = useTheme();

  return (
    <div>
      <Box sx={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1100 }}>
        <TopBar completed={30} inProgress={40} title="Design Documents" onUpdateTheme={onUpdateTheme} />
      </Box>
      <Box sx={{ display: 'flex', mt: 10 }}>
        <Sidebar />
        <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Box sx={{ flex: 1 }}>
                <Grid item xs={12} md={12}>
                  <Tabs value={selectedTab} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
                    <Tab label="Project Charter" />
                    <Tab label="Design Document" />
                    <Tab label="Product Backlog" />
                    <Tab label="Planning Document" />
                    <Tab label="Retrospective" />
                  </Tabs>
                </Grid>
                <a href={pdfDisplayURL} download="test.pdf">
                  <Button sx={{ color: theme.palette.text.primary }}>Download Document</Button>
                </a>
                <input
                  type="file"
                  style={{ display: 'none' }}
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".pdf"
                />
               
               <a href={templateURL} download>
          <Button sx={{ color: theme.palette.text.primary }}>Download Template</Button>
                </a>

                <Button
                  sx={{ color: theme.palette.text.primary }}
                  onClick={handleUploadButtonClick}
                >
                  Upload PDF
                </Button>
                {selectedFile && (
                  <Button sx={{ color: theme.palette.text.primary }} onClick={handleUpload}>
                    Confirm Upload
                  </Button>
                )}
                <iframe src={pdfDisplayURL} width="100%" height="600px" />
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Box>
    </div>
  );
}

export default DesignDocuments;