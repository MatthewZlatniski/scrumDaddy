import mysql from 'mysql';
import { expect } from 'chai';

describe('Drag drop test', () => {
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

  it('check changing status to done', (done) => {
    // Define the comment data to be inserted
    const taskData = {
      taskprojectuserlistID: 36,
      taskname: 'Make some three pointers',
      lane: 'Done',
    };

    // Perform database query to insert the comment
    connection.query('UPDATE taskprojectlist SET lane = ? WHERE taskprojectuserlistID = ? AND taskname = ?',
    [taskData.lane, taskData.taskprojectuserlistID, taskData.taskname],(error, results) => {
      if (error) {
        return done(error);
      }

      // Check if the insert operation was successful
      expect(results.affectedRows).to.equal(1);

      // Query the database to verify if the comment was added
      connection.query('SELECT * FROM taskprojectlist WHERE taskprojectuserlistID = ?', taskData.taskprojectuserlistID, (error, results) => {
        if (error) {
          return done(error);
        }

        // Assert that the comment exists in the database
        expect(results).to.be.an('array');
        expect(results).to.have.lengthOf.at.least(1);
        expect(results[0].taskname).to.equal(taskData.taskname);
        expect(results[0].lane).to.equal(taskData.lane);

        done();
      });
    });
  });

  it('check changing status in progress', (done) => {
    // Define the comment data to be inserted
    const taskData = {
      taskprojectuserlistID: 37,
      taskname: 'Rebound',
      lane: 'In Progress',
    };

    // Perform database query to insert the comment
    connection.query('UPDATE taskprojectlist SET lane = ? WHERE taskprojectuserlistID = ? AND taskname = ?',
    [taskData.lane, taskData.taskprojectuserlistID, taskData.taskname],(error, results) => {
      if (error) {
        return done(error);
      }

      // Check if the insert operation was successful
      expect(results.affectedRows).to.equal(1);

      // Query the database to verify if the comment was added
      connection.query('SELECT * FROM taskprojectlist WHERE taskprojectuserlistID = ?', taskData.taskprojectuserlistID, (error, results) => {
        if (error) {
          return done(error);
        }

        // Assert that the comment exists in the database
        expect(results).to.be.an('array');
        expect(results).to.have.lengthOf.at.least(1);
        expect(results[0].taskname).to.equal(taskData.taskname);
        expect(results[0].lane).to.equal(taskData.lane);

        done();
      });
    });
  });

  // Add more test cases for other database interactions, such as listing comments
});
