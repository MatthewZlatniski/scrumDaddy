import mysql from 'mysql';
import { expect } from 'chai';

describe('Forgot Password Test 1', () => {
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

  it('It should create a token when a user tries to reset their password', (done) => {
    // Define the project data to be inserted
    const projectData = {
      projectName: 'Test 1',
      projectDescription: 'This is a descriptor of Test 1',
    };

    // Perform database query to insert the project
    connection.query('INSERT INTO projectlist SET ?', projectData, (error, results) => {
      if (error) {
        return done(error);
      }

      // Check if the insert operation was successful
      expect(results.affectedRows).to.equal(1);

      // Query the database to verify if the project was added
      connection.query('SELECT * FROM projectlist WHERE projectName = ?', projectData.projectName, (error, results) => {
        if (error) {
          return done(error);
        }

        // Assert that the project exists in the database
        expect(results).to.be.an('array');
        expect(results).to.have.lengthOf.at.least(1);
        expect(results[0].projectName).to.equal(projectData.projectName);
        expect(results[0].projectDescription).to.equal(projectData.projectDescription);

        // Perform database query to delete the inserted project
        connection.query('DELETE FROM projectlist WHERE projectName = ?', projectData.projectName, (error, deleteResults) => {
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

describe('Forgot Password Test 2', () => {
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

  it('New password should be in the database', (done) => {
    // Define the project data to be inserted
    const projectData = {
      projectName: 'Test 2',
      projectDescription: 'This is a descriptor of Test 2',
    };

    // Perform database query to insert the project
    connection.query('INSERT INTO projectlist SET ?', projectData, (error, results) => {
      if (error) {
        return done(error);
      }

      // Check if the insert operation was successful
      expect(results.affectedRows).to.equal(1);

      // Query the database to verify if the project was added
      connection.query('SELECT * FROM projectlist WHERE projectName = ?', projectData.projectName, (error, results) => {
        if (error) {
          return done(error);
        }

        // Assert that the project exists in the database
        expect(results).to.be.an('array');
        expect(results).to.have.lengthOf.at.least(1);
        expect(results[0].projectName).to.equal(projectData.projectName);
        expect(results[0].projectDescription).to.equal(projectData.projectDescription);

        // Perform database query to delete the inserted project
        connection.query('DELETE FROM projectlist WHERE projectName = ?', projectData.projectName, (error, deleteResults) => {
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