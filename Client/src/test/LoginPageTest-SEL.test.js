import "@testing-library/jest-dom";
jest.setTimeout(1000 * 60);

/*
  Unzip and run before running the test https://developer.microsoft.com/en-us/microsoft-edge/tools/webdriver/?form=MA13LH
*/

const webdriver = require("selenium-webdriver");
var edge = require("selenium-webdriver/edge");
const { Builder } = webdriver;
var service = new edge.ServiceBuilder().setPort(9515).build();
const options = new edge.Options();
//options.addArguments("start-maximized");

var driver = edge.Driver.createSession(options, service);

describe("Login Page Test", () => {
  test("Signup Errors", async () => {
    // load page and wait for it
    await driver.get("http://localhost:3000/");
    await driver.sleep(1000);

    // click sign up button to show the signup side of the menu
    const signUpButton = await driver.findElement(
      webdriver.By.xpath("/html/body/div/div/div/div[1]/button")
    );
    await signUpButton.click();
    await driver.sleep(250);

    /* Username Field Only */
    // fill in "me" in the username field
    const usernameBox = await driver.findElement(
      webdriver.By.xpath("/html/body/div/div/div/div[2]/form/label[1]/input")
    );
    await usernameBox.sendKeys("me");
    await driver.sleep(250);

    // click on signup buton
    const secondSignupButton = await driver.findElement(
      webdriver.By.xpath('//*[@id="root"]/div/div/div[2]/form/button')
    );
    secondSignupButton.click();
    await driver.sleep(250);

    // look for error
    var signupErrorMessage = await driver
      .findElement(
        webdriver.By.xpath("/html/body/div/div/div/div[2]/div/div[3]")
      )
      .isDisplayed();
    await driver.sleep(250);

    // assert
    await expect(signupErrorMessage).toBe(true);
    signupErrorMessage = null;

    // clear username field
    usernameBox.clear();
    await driver.sleep(250);

    /* Email Field Only */
    // find email field and fill it in
    const emailBox = await driver.findElement(
      webdriver.By.xpath("/html/body/div/div/div/div[2]/form/label[2]/input")
    );
    await emailBox.sendKeys("me@me.com");

    // try signing up again
    secondSignupButton.click();
    signupErrorMessage = await driver
      .findElement(
        webdriver.By.xpath("/html/body/div/div/div/div[2]/div/div[3]")
      )
      .isDisplayed();

    // assert
    await expect(signupErrorMessage).toBe(true);
    signupErrorMessage = null;

    // clear email field
    emailBox.clear();

    /* Password Field Only*/

    console.log("Test Ended");

    await driver.sleep(10000);
    await driver.quit();
  });
});
