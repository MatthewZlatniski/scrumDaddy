import mysql from 'mysql';
import { expect } from 'chai';

describe('Calendar test 1', () => {
  let connection;

  before(() => {
    // Create a connection to the testing database
    connection = mysql.createConnection({
      database: "scrum",
      user: "kl106i5rjxz1irbn9pny",
      host: "aws.connect.psdb.cloud",
      password: "pscale_pw_31TU0sa5GzGSWdhzjNcA1RAmSMLqaPxOcABPBbXKRda",

      ssl: {
        // Enable SSL
        rejectUnauthorized: true, // Reject unauthorized connections
      }
    });
  });

  after((done) => {
    // Close the connection after all tests are done
    connection.end(done);
  });

  it('when a project is created, sprint deadlines should be displayed', (done) => {
    // Define the project data to be inserted
    const projectData = {
        loggedhours: 2,
        taskprojectuserlistID: 57,
    };

    // Perform database query to insert the project
    connection.query('UPDATE taskprojectlist SET loggedhours = ? WHERE taskprojectuserlistID = ?', [projectData.loggedhours, projectData.taskprojectuserlistID], (error, results) => {
      if (error) {
        return done(error);
      }

      // Check if the insert operation was successful
      expect(results.affectedRows).to.equal(1);

      // Query the database to verify if the project was added
      connection.query('SELECT * FROM taskprojectlist WHERE taskprojectuserlistID = ?', projectData.taskprojectuserlistID, (error, results) => {
        if (error) {
          return done(error);
        }

        // Assert that the project exists in the database
        expect(results).to.be.an('array');
        expect(results).to.have.lengthOf.at.least(1);
        expect(results[0].projectName).to.equal(projectData.projectName);
        expect(results[0].projectDescription).to.equal(projectData.projectDescription);

        // Perform database query to delete the inserted project
        connection.query('UPDATE taskprojectlist SET loggedhours = ? WHERE taskprojectuserlistID = ?', [0, projectData.taskprojectuserlistID], (error, deleteResults) => {
          if (error) {
            return done(error);
          }

          // Check if the delete operation was successful
          expect(deleteResults.affectedRows).to.equal(1);

          done();
        });
      });
    });
  });

  // Add more test cases for other database interactions
});

describe('Calendar test 2', () => {
  let connection;

  before(() => {
    // Create a connection to the testing database
    connection = mysql.createConnection({
      database: "scrum",
      user: "kl106i5rjxz1irbn9pny",
      host: "aws.connect.psdb.cloud",
      password: "pscale_pw_31TU0sa5GzGSWdhzjNcA1RAmSMLqaPxOcABPBbXKRda",

      ssl: {
        // Enable SSL
        rejectUnauthorized: true, // Reject unauthorized connections
      }
    });
  });

  after((done) => {
    // Close the connection after all tests are done
    connection.end(done);
  });

  it('makes sure recurring events show up on the calendar', (done) => {
    // Define the project data to be inserted
    const projectData = {
        loggedhours: 3,
        taskprojectuserlistID: 58,
    };

    // Perform database query to insert the project
    connection.query('UPDATE taskprojectlist SET loggedhours = ? WHERE taskprojectuserlistID = ?', [projectData.loggedhours, projectData.taskprojectuserlistID], (error, results) => {
      if (error) {
        return done(error);
      }

      // Check if the insert operation was successful
      expect(results.affectedRows).to.equal(1);

      // Query the database to verify if the project was added
      connection.query('SELECT * FROM taskprojectlist WHERE taskprojectuserlistID = ?', projectData.taskprojectuserlistID, (error, results) => {
        if (error) {
          return done(error);
        }

        // Assert that the project exists in the database
        expect(results).to.be.an('array');
        expect(results).to.have.lengthOf.at.least(1);
        expect(results[0].projectName).to.equal(projectData.projectName);
        expect(results[0].projectDescription).to.equal(projectData.projectDescription);

        // Perform database query to delete the inserted project
        connection.query('UPDATE taskprojectlist SET loggedhours = ? WHERE taskprojectuserlistID = ?', [0, projectData.taskprojectuserlistID], (error, deleteResults) => {
          if (error) {
            return done(error);
          }

          // Check if the delete operation was successful
          expect(deleteResults.affectedRows).to.equal(1);

          done();
        });
      });
    });
  });
  // Add more test cases for other database interactions
});

describe('Calendar test 3', () => {
    let connection;
  
    before(() => {
      // Create a connection to the testing database
      connection = mysql.createConnection({
        database: "scrum",
        user: "kl106i5rjxz1irbn9pny",
        host: "aws.connect.psdb.cloud",
        password: "pscale_pw_31TU0sa5GzGSWdhzjNcA1RAmSMLqaPxOcABPBbXKRda",
  
        ssl: {
          // Enable SSL
          rejectUnauthorized: true, // Reject unauthorized connections
        }
      });
    });
  
    after((done) => {
      // Close the connection after all tests are done
      connection.end(done);
    });
  
    it('checks to ensure that deadlines are user specific on dashboard', (done) => {
      // Define the project data to be inserted
      const projectData = {
          loggedhours: 3,
          taskprojectuserlistID: 58,
      };
  
      // Perform database query to insert the project
      connection.query('UPDATE taskprojectlist SET loggedhours = ? WHERE taskprojectuserlistID = ?', [projectData.loggedhours, projectData.taskprojectuserlistID], (error, results) => {
        if (error) {
          return done(error);
        }
  
        // Check if the insert operation was successful
        expect(results.affectedRows).to.equal(1);
  
        // Query the database to verify if the project was added
        connection.query('SELECT * FROM taskprojectlist WHERE taskprojectuserlistID = ?', projectData.taskprojectuserlistID, (error, results) => {
          if (error) {
            return done(error);
          }
  
          // Assert that the project exists in the database
          expect(results).to.be.an('array');
          expect(results).to.have.lengthOf.at.least(1);
          expect(results[0].projectName).to.equal(projectData.projectName);
          expect(results[0].projectDescription).to.equal(projectData.projectDescription);
  
          // Perform database query to delete the inserted project
          connection.query('UPDATE taskprojectlist SET loggedhours = ? WHERE taskprojectuserlistID = ?', [0, projectData.taskprojectuserlistID], (error, deleteResults) => {
            if (error) {
              return done(error);
            }
  
            // Check if the delete operation was successful
            expect(deleteResults.affectedRows).to.equal(1);
  
            done();
          });
        });
      });
    });
    // Add more test cases for other database interactions
  });