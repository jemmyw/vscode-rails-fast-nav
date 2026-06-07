import { VSBrowser, WebDriver } from "vscode-extension-tester";

describe("test", function () {
  this.timeout(10000);

  let browser: VSBrowser;
  let driver: WebDriver;

  before(async () => {
    browser = VSBrowser.instance;
    driver = browser.driver;

    await browser.openResources("out/test/");
    await browser.waitForWorkbench();
  });

  it("has a title", async () => {
    const title = await driver.getTitle();
    console.log(title);
  });
});
