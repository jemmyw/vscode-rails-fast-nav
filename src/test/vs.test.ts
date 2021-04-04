import {
  InputBox,
  VSBrowser,
  WebDriver,
  Workbench,
} from "vscode-extension-tester";

describe("test", function () {
  this.timeout(10000);

  let browser: VSBrowser;
  let driver: WebDriver;
  let workbench: Workbench;

  before(async () => {
    browser = VSBrowser.instance;
    driver = browser.driver;
    workbench = new Workbench();

    await workbench.executeCommand("Extest: Open Folder");
    const input = await InputBox.create();
    await input.setText("out/test/");
    await input.confirm();
  });

  it("has a title", async () => {
    const title = await driver.getTitle();
    console.log(title);
  });
});
