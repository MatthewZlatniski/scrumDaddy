const express = require("express");
const router = express.Router();
const multer = require('multer');
const jwt = require('jsonwebtoken');

// imports the function to get a username from an auth token
const { extractUsernameFromToken } = require('../authMiddleware');

const upload = multer({ storage: multer.memoryStorage() });

module.exports = (app, con) => {
  app.post('/uploadPdf/projectCharter', upload.single('pdf'), extractUsernameFromToken, async (req, res) => {
    const { projectID } = req.body;
    const pdfData = req.file.buffer;

    try {
      await queryAsync('UPDATE projectlist SET pdfData = ? WHERE projectID = ?', [pdfData, projectID]);
      res.status(200).json({ message: 'PDF uploaded successfully' });
    } catch (error) {
      console.error('Error uploading PDF:', error);
      res.status(500).json({ error: 'Failed to upload PDF' });
    }
  });

  app.post('/uploadPdf/designDocument', upload.single('pdf'), extractUsernameFromToken, async (req, res) => {
    const { projectID } = req.body;
    const pdfData = req.file.buffer;

    try {
      await queryAsync('UPDATE projectlist SET pdf2Data = ? WHERE projectID = ?', [pdfData, projectID]);
      res.status(200).json({ message: 'PDF uploaded successfully' });
    } catch (error) {
      console.error('Error uploading PDF:', error);
      res.status(500).json({ error: 'Failed to upload PDF' });
    }
  });

  app.post('/uploadPdf/productBacklog', upload.single('pdf'), extractUsernameFromToken, async (req, res) => {
    const { projectID } = req.body;
    const pdfData = req.file.buffer;

    try {
      await queryAsync('UPDATE projectlist SET pdf3Data = ? WHERE projectID = ?', [pdfData, projectID]);
      res.status(200).json({ message: 'PDF uploaded successfully' });
    } catch (error) {
      console.error('Error uploading PDF:', error);
      res.status(500).json({ error: 'Failed to upload PDF' });
    }
  });

  app.post('/uploadPdf/planningDocument', upload.single('pdf'), extractUsernameFromToken, async (req, res) => {
    const { projectID } = req.body;
    const pdfData = req.file.buffer;

    try {
      await queryAsync('UPDATE projectlist SET pdf4Data = ? WHERE projectID = ?', [pdfData, projectID]);
      res.status(200).json({ message: 'PDF uploaded successfully' });
    } catch (error) {
      console.error('Error uploading PDF:', error);
      res.status(500).json({ error: 'Failed to upload PDF' });
    }
  });

  app.post('/uploadPdf/retrospective', upload.single('pdf'), extractUsernameFromToken, async (req, res) => {
    const { projectID } = req.body;
    const pdfData = req.file.buffer;

    try {
      await queryAsync('UPDATE projectlist SET pdf5Data = ? WHERE projectID = ?', [pdfData, projectID]);
      res.status(200).json({ message: 'PDF uploaded successfully' });
    } catch (error) {
      console.error('Error uploading PDF:', error);
      res.status(500).json({ error: 'Failed to upload PDF' });
    }
  });

  app.get('/downloadPdf/:projectID/projectCharter', extractUsernameFromToken, async (req, res) => {
    const { projectID } = req.params;

    try {
      const result = await queryAsync('SELECT pdfData FROM projectlist WHERE projectID = ?', [projectID]);
      if (result.length === 0) {
        console.error('Error downloading PDF: Project not found');
        return res.status(404).json({ error: 'Project not found' });
      }

      const pdfData = result[0].pdfData;
      if (!pdfData) {
        console.error('Error downloading PDF: PDF data not found');
        return res.status(404).json({ error: 'PDF data not found' });
      }

      res.contentType('application/pdf');
      res.send(pdfData);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      res.status(500).json({ error: 'Failed to download PDF' });
    }
  });

  app.get('/downloadPdf/:projectID/designDocument', extractUsernameFromToken, async (req, res) => {
    const { projectID } = req.params;

    try {
      const result = await queryAsync('SELECT pdf2Data FROM projectlist WHERE projectID = ?', [projectID]);
      if (result.length === 0) {
        console.error('Error downloading PDF: Project not found');
        return res.status(404).json({ error: 'Project not found' });
      }

      const pdfData = result[0].pdf2Data;
      if (!pdfData) {
        console.error('Error downloading PDF: PDF data not found');
        return res.status(404).json({ error: 'PDF data not found' });
      }

      res.contentType('application/pdf');
      res.send(pdfData);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      res.status(500).json({ error: 'Failed to download PDF' });
    }
  });

  app.get('/downloadPdf/:projectID/productBacklog', extractUsernameFromToken, async (req, res) => {
    const { projectID } = req.params;

    try {
      const result = await queryAsync('SELECT pdf3Data FROM projectlist WHERE projectID = ?', [projectID]);
      if (result.length === 0) {
        console.error('Error downloading PDF: Project not found');
        return res.status(404).json({ error: 'Project not found' });
      }

      const pdfData = result[0].pdf3Data;
      if (!pdfData) {
        console.error('Error downloading PDF: PDF data not found');
        return res.status(404).json({ error: 'PDF data not found' });
      }

      res.contentType('application/pdf');
      res.send(pdfData);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      res.status(500).json({ error: 'Failed to download PDF' });
    }
  });

  app.get('/downloadPdf/:projectID/planningDocument', extractUsernameFromToken, async (req, res) => {
    const { projectID } = req.params;

    try {
      const result = await queryAsync('SELECT pdf4Data FROM projectlist WHERE projectID = ?', [projectID]);
      if (result.length === 0) {
        console.error('Error downloading PDF: Project not found');
        return res.status(404).json({ error: 'Project not found' });
      }

      const pdfData = result[0].pdf4Data;
      if (!pdfData) {
        console.error('Error downloading PDF: PDF data not found');
        return res.status(404).json({ error: 'PDF data not found' });
      }

      res.contentType('application/pdf');
      res.send(pdfData);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      res.status(500).json({ error: 'Failed to download PDF' });
    }
  });

  app.get('/downloadPdf/:projectID/retrospective', extractUsernameFromToken, async (req, res) => {
    const { projectID } = req.params;

    try {
      const result = await queryAsync('SELECT pdf5Data FROM projectlist WHERE projectID = ?', [projectID]);
      if (result.length === 0) {
        console.error('Error downloading PDF: Project not found');
        return res.status(404).json({ error: 'Project not found' });
      }

      const pdfData = result[0].pdf5Data;
      if (!pdfData) {
        console.error('Error downloading PDF: PDF data not found');
        return res.status(404).json({ error: 'PDF data not found' });
      }

      res.contentType('application/pdf');
      res.send(pdfData);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      res.status(500).json({ error: 'Failed to download PDF' });
    }
  });

  // Utility function to promisify the MySQL queries
  function queryAsync(sql, params) {
    return new Promise((resolve, reject) => {
      con.query(sql, params, (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  }

  return router;
};