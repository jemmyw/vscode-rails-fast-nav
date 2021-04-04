import { expect } from "chai";
import * as path from "path";
import * as fs from "fs";
import {
  ActivityBar,
  InputBox,
  TextEditor,
  Workbench,
} from "vscode-extension-tester";

const PROJECT_PATH = path.resolve("out/test");
const packageJson: unknown = JSON.parse(
  (fs.readFileSync(path.resolve("package.json")) as unknown) as string
);
const COMMANDS: { [index: string]: string } = packageJson["contributes"][
  "commands"
].reduce(
  (acc, item) => ({
    ...acc,
    [item["command"]]: item["title"],
  }),
  {}
);

describe("Extension Tests", function () {
  this.timeout(60000);

  let workbench: Workbench;

  async function openFile(filename: string, line?: number) {
    await executeCommand("Extest: Open File");
    const input = await InputBox.create();
    await input.setText(path.join(PROJECT_PATH, filename));
    await input.confirm();

    const editor = new TextEditor();
    await editor.wait(1000);

    if (line > 0) await gotoLine(line);

    return editor;
  }

  async function executeCommand(command: string) {
    await workbench.executeCommand(command);
    await workbench.getDriver().sleep(100);
  }

  async function executeRawCommand(command: string) {
    return await executeCommand(COMMANDS[command]);
  }

  async function expectProjectFile(name: string) {
    const editor = new TextEditor();
    expect((await editor.getFilePath()).endsWith(name)).to.be.true;
  }

  async function gotoLine(line: number): Promise<void> {
    const editor = new TextEditor();
    await editor.moveCursor(line, 1);
  }

  before(async () => {
    workbench = new Workbench();
    await executeCommand("Extest: Open Folder");
    const input = await InputBox.create();
    await input.setText(PROJECT_PATH + "/");
    await input.confirm();

    // to open a specific view and look it up
    const control = await new ActivityBar().getViewControl("Explorer");
    const explorer = await control.openView();
    console.log(await explorer.getTitlePart().getTitle());
  });

  beforeEach(async () => {
    await executeCommand("View: Close All Editors");
  });

  it("commands are available", async () => {
    await openFile("app/controllers/cats_controller.rb");

    await workbench.openCommandPrompt();
    const input = await InputBox.create();
    await input.setText("Rails:");

    for (let command of [
      "Rails: Fast Navigation",
      "Rails: Switch to View",
      "Rails: Switch to Controller",
      "Rails: Switch to Model",
      "Rails: Switch to Test",
      "Rails: Switch to Spec",
      "Rails: Switch to Fixture",
      "Rails: Create View",
      "Rails: Create Spec",
    ]) {
      const pick = await input.findQuickPick(command);
      expect(pick, "to be present");
    }
  }).timeout(60000);

  describe("from controller file", () => {
    beforeEach(async () => {
      await openFile("app/controllers/cats_controller.rb");
      await expectProjectFile("app/controllers/cats_controller.rb");
    });

    it("switches to model", async () => {
      await executeRawCommand("rails.switchToModel");
      await expectProjectFile("app/models/cat.rb");
    });

    it("shows all actions from the top of the controller", async () => {
      await executeRawCommand("rails.switchToView");
      const input = await InputBox.create();
      const picks = await input.getQuickPicks();
      const strings = await Promise.all(picks.map((p) => p.getLabel()));

      expect(strings).to.deep.equal([
        "View edit.html.haml",
        "View index.html.erb",
        "View new.html.erb",
        "View new.null",
        "View show.js.erb",
        "View hello",
        "Partial _cat.html.erb",
      ]);
    });

    it("switch to view", async () => {
      await gotoLine(7);
      await executeCommand("rails.switchToView");
      await expectProjectFile("app/views/cats/show.js.erb");
    });

    it("switch to haml view", async () => {
      await gotoLine(11);
      await executeRawCommand("rails.switchToView");
      await expectProjectFile("app/views/cats/edit.html.haml");
    });

    describe("create view", () => {
      it("with default extension", async () => {
        await gotoLine(15);
        await executeRawCommand("rails.createView");

        const input = await InputBox.create();
        const text = await input.getText();
        expect(text).to.equal("new.html.erb");
        await input.confirm();
        await expectProjectFile("app/views/cats/new.html.erb");
      });

      it("with custom extension", async () => {
        const settings = await workbench.openSettings();
        const setting = await settings.findSetting(
          "View File Extension",
          "Rails"
        );
        expect(setting).to.exist;
        await setting.click();
        await setting.setValue("html.haml");
        await workbench.executeCommand("View: Close Editor");

        await openFile("app/controllers/cats_controller.rb", 15);
        await executeRawCommand("rails.createView");
        const input = await InputBox.create();
        expect(await input.getText()).to.equal("new.html.haml");
        await input.confirm();

        await expectProjectFile("app/views/cats/new.html.haml");
      });
    });

    it("create spec", async () => {
      await openFile("app/controllers/cats_controller.rb");
      await executeRawCommand("rails.createSpec");
      await expectProjectFile("spec/controllers/cats_controller_spec.rb");
    });
  });

  describe("from view file", () => {
    it("switch to controller", async () => {
      await openFile("app/views/cats/_cat.html.erb");
      await executeCommand("rails.switchToController");
      await expectProjectFile("app/controllers/cats_controller.rb");
    });

    it("switch to module controller", async () => {
      await openFile("app/views/big/lions/new.html.erb");
      await executeRawCommand("rails.switchToController");
      await expectProjectFile("app/controllers/big/lions_controller.rb");
    });
  });

  describe("from model file", () => {
    it("switch to module fixture", async () => {
      await openFile("app/models/big/lion.rb");
      await executeRawCommand("rails.switchToFixture");
      await expectProjectFile("spec/fixtures/big_lions.yml");
    });

    it("switch to spec", async () => {
      await openFile("app/models/cat.rb");
      await executeRawCommand("rails.switchToSpec");
      await expectProjectFile("spec/models/cat_spec.rb");
    });
  });
});
