import { expect } from 'chai';
import sinon from 'sinon';
import nodemailer from 'nodemailer';

describe('Email Verification Tests', () => {
  let transporterStub;
  let queryStub;

  before(() => {
    // Stub nodemailer.createTransport to prevent actual email sending
    transporterStub = sinon.stub(nodemailer, 'createTransport').returns({
      sendMail: sinon.stub().resolves(),
    });
    // Initialize queryStub
    queryStub = sinon.stub();
  });

  after(() => {
    // Restore the original method after all tests are done
    transporterStub.restore();
  });

  it('should send a verification email', async () => {
    // Mock request body
    const reqBody = {
      email: 'test@example.com',
      verificationCode: 'verificationToken123',
    };

    // Simulate sending verification email
    await sendVerificationEmail(reqBody.email, reqBody.verificationCode);

    // Assert that sendMail was called
    expect(transporterStub().sendMail.calledOnce).to.be.true;
  });

  it('should handle errors when sending verification email', async () => {
    const reqBody = {
      email: 'test@example.com',
      verificationCode: 'verificationToken123',
    };

    transporterStub.returns({
      sendMail: sinon.stub().rejects(new Error('Failed to send email')),
    });

    try {
      await sendVerificationEmail(reqBody.email, reqBody.verificationCode);
      // If the promise resolves without error, fail the test
      throw new Error('Promise did not reject as expected');
    } catch (error) {
      // Assert that the error message matches the expected error message
      expect(error.message).to.equal('Failed to send email');
    }
  });
  it('should send a verification email upon user signup', async () => {
    // Stub the sendVerificationEmail function to prevent actual email sending
    const sendVerificationEmailStub = sinon.stub().resolves();

    // Mock request body
    const reqBody = {
      email: 'test@example.com',
      name: 'Test User',
      password: 'password123',
    };

    const verificationToken = 'verificationToken123';

    // Call the function
    await sendVerificationEmailStub(reqBody.email, verificationToken);

    // Assert that sendMail was called
    expect(transporterStub().sendMail.calledOnce).to.be.true;

    // Assert email content
    const emailOptions = transporterStub().sendMail.getCall(0).args[0];
    //console.log('Email text:', emailOptions.text); // Log the email text

    expect(emailOptions.to).to.equal(reqBody.email);
    expect(emailOptions.subject).to.equal('Verify Your Email Address');
    expect(emailOptions.text).to.include('Click on the following link to verify your email:');
    expect(emailOptions.text).to.include('http://localhost:3000/verification');
    expect(emailOptions.text).to.include('and your code is verificationToken123');
  });
});


// Function to send verification email
async function sendVerificationEmail(email, verificationCode) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    port: 465,
    secure: false,
    logger: true,
    debug: true,
    secureConnection: false,
    auth: {
      user: 'noreplyscrumdaddy@gmail.com', // Your Gmail email address
      pass: 'egpndlwyujkiupur' // Your Gmail password
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  const mailOptions = {
    from: 'noreplyscrumdaddy@gmail.com',
    to: email,
    subject: 'Verify Your Email Address',
    text: `Click on the following link to verify your email: http://localhost:3000/verification \nand your code is ${verificationCode}`
  };
  //console.log("Email about to be sent");
  return await transporter.sendMail(mailOptions);
}
