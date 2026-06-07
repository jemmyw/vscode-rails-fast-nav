import { expect } from "chai";
import * as path from "path";
import * as fs from "fs";
import {
  ActivityBar,
  InputBox,
  TextEditor,
  VSBrowser,
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
    await VSBrowser.instance.openResources(path.join(PROJECT_PATH, filename));

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
    await VSBrowser.instance.openResources(PROJECT_PATH);
    await VSBrowser.instance.waitForWorkbench();

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
      "Rails: Switch to Factory",
      "Rails: Create View",
      "Rails: Create Spec",
      "Rails: Create Factory",
    ]) {
      const pick = await input.findQuickPick(command);
      expect(pick, "to be present");
    }

    await input.cancel();
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
        "View show.js.erb",
        "View hello",
        "Partial _cat.html.erb",
      ]);

      await input.cancel();
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
        const wsSettingsPath = path.join(
          PROJECT_PATH,
          ".vscode",
          "settings.json"
        );
        const originalSettings = fs.readFileSync(wsSettingsPath, "utf8");
        const settings = JSON.parse(originalSettings);
        settings["rails.viewFileExtension"] = "html.haml";
        fs.writeFileSync(wsSettingsPath, JSON.stringify(settings, null, 2));

        try {
          await openFile("app/controllers/cats_controller.rb", 15);
          // give VS Code time to pick up the changed workspace setting
          await new Promise((resolve) => setTimeout(resolve, 1000));
          await executeRawCommand("rails.createView");
          const input = await InputBox.create();
          expect(await input.getText()).to.equal("new.html.haml");
          await input.confirm();

          await expectProjectFile("app/views/cats/new.html.haml");
        } finally {
          fs.writeFileSync(wsSettingsPath, originalSettings);
        }
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

    it("switch to factory", async () => {
      await openFile("app/models/cat.rb");
      await executeRawCommand("rails.switchToFactory");
      await expectProjectFile("spec/factories/cats.rb");
    });

    it("switch to module factory", async () => {
      await openFile("app/models/big/lion.rb");
      await executeRawCommand("rails.switchToFactory");
      await expectProjectFile("spec/factories/big/lions.rb");
    });

    it("create factory", async () => {
      await openFile("app/models/dog.rb");
      await executeRawCommand("rails.createFactory");
      await expectProjectFile("spec/factories/dogs.rb");
    });
  });

  describe("from mailer file", () => {
    it("switches to the current mailer action view", async () => {
      await openFile("app/mailers/user_mailer.rb", 2);
      await executeRawCommand("rails.switchToView");
      await expectProjectFile("app/views/user_mailer/welcome.html.erb");
    });

    it("switches to a namespaced mailer action view", async () => {
      await openFile("app/mailers/admin/report_mailer.rb", 3);
      await executeRawCommand("rails.switchToView");
      await expectProjectFile(
        "app/views/admin/report_mailer/daily_summary.html.erb"
      );
    });

    it("includes mailer views in fast navigation", async () => {
      await openFile("app/mailers/user_mailer.rb", 2);
      await executeRawCommand("rails.fastNavigation");
      const input = await InputBox.create();
      const picks = await input.getQuickPicks();
      const strings = await Promise.all(picks.map((p) => p.getLabel()));

      expect(strings).to.deep.equal([
        "View welcome.html.erb",
        "View password_reset.text.erb",
      ]);

      await input.cancel();
    });
  });

  describe("Packwerk-style package (rails.appDirs)", () => {
    it("switch to view from package controller", async () => {
      await openFile(
        "packs/billing/app/controllers/billing/invoices_controller.rb"
      );
      await gotoLine(3);
      await executeRawCommand("rails.switchToView");
      await expectProjectFile(
        "packs/billing/app/views/billing/invoices/show.html.erb"
      );
    });

    it("switch to model from package controller", async () => {
      await openFile(
        "packs/billing/app/controllers/billing/invoices_controller.rb"
      );
      await executeRawCommand("rails.switchToModel");
      await expectProjectFile("packs/billing/app/models/billing/invoice.rb");
    });

    it("switch to spec from package model", async () => {
      await openFile("packs/billing/app/models/billing/invoice.rb");
      await executeRawCommand("rails.switchToSpec");
      await expectProjectFile("packs/billing/spec/models/billing/invoice_spec.rb");
    });
  });

  describe("Rails engine (rails.appDirs)", () => {
    it("switch to view from engine controller", async () => {
      await openFile(
        "engines/documents/app/controllers/documents/documents_controller.rb"
      );
      await gotoLine(3);
      await executeRawCommand("rails.switchToView");
      await expectProjectFile(
        "engines/documents/app/views/documents/documents/index.html.erb"
      );
    });
  });
});
