import mysql from 'mysql';
import { expect } from 'chai';

describe('Comment Tests', () => {
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

  it('should add a comment to the database', (done) => {
    // Define the comment data to be inserted
    const commentData = {
      taskProjectID: 85,
      username: 'matthew',
      commenttext: 'new comment test.',
    };

    // Perform database query to insert the comment
    connection.query('UPDATE comments SET commenttext = ? WHERE taskprojectID = ? AND username = ?',
    [commentData.commenttext, commentData.taskProjectID, commentData.username],(error, results) => {
      if (error) {
        return done(error);
      }

      // Check if the insert operation was successful
      expect(results.affectedRows).to.equal(1);

      // Query the database to verify if the comment was added
      connection.query('SELECT * FROM comments WHERE taskprojectID = ?', commentData.taskProjectID, (error, results) => {
        if (error) {
          return done(error);
        }

        // Assert that the comment exists in the database
        expect(results).to.be.an('array');
        expect(results).to.have.lengthOf.at.least(1);
        expect(results[0].username).to.equal(commentData.username);
        expect(results[0].commenttext).to.equal(commentData.commenttext);

        done();
      });
    });
  });

  it('should add another comment in the database', (done) => {
    // Define the updated comment data
    const updatedCommentData = {
      taskProjectID: 74,
      username: 'admin',
      updatedCommentText: 'This is the updated comment text.',
    };
  
    // Perform database query to update the comment
    connection.query('UPDATE comments SET commenttext = ? WHERE taskprojectID = ? AND username = ?',
    [updatedCommentData.updatedCommentText, updatedCommentData.taskProjectID, updatedCommentData.username], (error, results) => {
      if (error) {
        return done(error);
      }
  
      // Check if the update operation was successful
      expect(results.affectedRows).to.equal(1);
  
      // Query the database to verify if the comment was updated
      connection.query('SELECT * FROM comments WHERE taskprojectID = ? AND username = ?',
      [updatedCommentData.taskProjectID, updatedCommentData.username], (error, results) => {
        if (error) {
          return done(error);
        }
  
        // Assert that the comment exists in the database with the updated text
        expect(results).to.be.an('array');
        expect(results).to.have.lengthOf.at.least(1);
        expect(results[0].username).to.equal(updatedCommentData.username);
        expect(results[0].commenttext).to.equal(updatedCommentData.updatedCommentText);
  
        done();
      });
    });
  });
  

  // Add more test cases for other database interactions, such as listing comments
});
