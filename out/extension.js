var __getOwnPropNames = Object.getOwnPropertyNames;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};

// src/helper.js
var require_helper = __commonJS({
  "src/helper.js"(exports2, module2) {
    var vscode2 = require("vscode");
    var path2 = require("path");
    var fs2 = require("fs");
    function searchForDirectory() {
      const workspaceFolder = vscode2.workspace.workspaceFolders;
      if (!workspaceFolder) {
        vscode2.window.showErrorMessage("No workspace folder found.");
        throw new Error("No workspace folders to open");
      }
      vscode2.window.showInformationMessage("Workspace folder is found");
      for (let folder of workspaceFolder) {
        const folderPath = folder.uri.path;
        let curDir = folderPath;
        while (true) {
          const gitPath = path2.join(curDir, ".git");
          if (fs2.existsSync(gitPath) && fs2.statSync(gitPath).isDirectory()) {
            return gitPath;
          }
          const parentDir = path2.dirname(curDir);
          if (parentDir == curDir) break;
          curDir = parentDir;
        }
      }
      console.log("no git found");
      return null;
    }
    async function setCurrentDirectory() {
      const workspaceFolders = vscode2.workspace.workspaceFolders;
      if (!workspaceFolders) {
        vscode2.window.showErrorMessage("no workspace found");
        throw new Error("No workspace folders to open");
      }
      process.chdir(workspaceFolders[0].uri.path);
    }
    module2.exports = {
      searchForDirectory,
      setCurrentDirectory
    };
  }
});

// src/logger.js
var require_logger = __commonJS({
  "src/logger.js"(exports2, module2) {
    var path2 = require("path");
    var fs2 = require("fs");
    var vscode2 = require("vscode");
    var childprocess2 = require("node:child_process");
    var helper2 = require_helper();
    async function logCommit(gitpath, commitMsg) {
      await helper2.setCurrentDirectory();
      let messageObj = {};
      messageObj.message = commitMsg.split("commit: ")[1];
      messageObj.date = /* @__PURE__ */ new Date();
      messageObj.branchName = childprocess2.execSync("git branch --show-current").toString().trim();
      let gitParentPath = path2.dirname(gitpath);
      const logDir = path2.join(gitParentPath, "commit_logs");
      const logFile = path2.join(logDir, "logs.json");
      if (!fs2.existsSync(logDir)) {
        const response = fs2.mkdirSync(logDir, { recursive: true });
      }
      if (!fs2.existsSync(logFile)) {
        fs2.writeFileSync(logFile, JSON.stringify(messageObj), "utf-8");
      } else {
        const fileContent = fs2.readFileSync(logFile, "utf-8");
        const jsonData = fileContent ? JSON.parse(fileContent) : [];
        if (Array.isArray(jsonData)) {
          jsonData.push(messageObj);
        }
        fs2.writeFileSync(logFile, JSON.stringify(jsonData), "utf-8");
      }
      vscode2.window.showInformationMessage(`commit logged at ${/* @__PURE__ */ new Date()}`);
    }
    module2.exports = {
      logCommit
    };
  }
});

// src/commands.js
var require_commands = __commonJS({
  "src/commands.js"(exports2, module2) {
    var vscode2 = require("vscode");
    var child_process = require("node:child_process");
    var helper2 = require_helper();
    var targetBranch = "";
    async function setTargetBranch() {
      await helper2.setCurrentDirectory();
      const branches = await getGitBranches();
      const targetBranch2 = await vscode2.window.showQuickPick(branches, {
        placeHolder: "Select a target branch to merge"
      });
      if (targetBranch2) {
        vscode2.window.showInformationMessage(`Selected target branch: ${targetBranch2}`);
        return targetBranch2;
      }
      return null;
    }
    function getGitBranches() {
      return new Promise((resolve, reject) => {
        child_process.exec("git branch -l", (error, res) => {
          if (error) {
            vscode2.window.showErrorMessage(`Error fetching branches ${JSON.stringify(error)}`);
            reject(error);
          } else {
            resolve(res.split("\n").map((branch) => branch.trim()).filter((branch) => branch));
          }
        });
      });
    }
    module2.exports = {
      setTargetBranch,
      targetBranch
    };
  }
});

// src/extension.js
var vscode = require("vscode");
var fs = require("fs");
var path = require("path");
var childprocess = require("node:child_process");
var logger = require_logger();
var helper = require_helper();
var commands = require_commands();
function activate(context) {
  setTimeout(() => {
    const gitExtension = vscode.extensions.getExtension("vscode.git")?.exports;
    const git = gitExtension?.getAPI(1);
    if (!git) {
      vscode.window.showErrorMessage("Git Extension API not available.");
      return;
    }
    vscode.window.showInformationMessage("Git Extension found!!");
    let gitpath = helper.searchForDirectory();
    const headPath = path.join(gitpath, "logs", "HEAD");
    if (fs.existsSync(headPath)) {
      fs.watch(headPath, (eventType) => {
        if (eventType == "change") {
          const logData = fs.readFileSync(headPath, "utf-8");
          const lastLine = logData.trim().split("\n").pop();
          logger.logCommit(gitpath, lastLine);
          const res = findingMergeConflict(commands.targetBranch);
          vscode.window.showInformationMessage(res.message);
        }
      });
    }
    console.log('Congratulations, your extension "custom-logger" is now active!');
    context.subscriptions.push(vscode.commands.registerCommand("custom-logger.helloWorld", function() {
      vscode.window.showInformationMessage("Hello World from custom-logger!");
    }));
    context.subscriptions.push(vscode.commands.registerCommand("custom-logger.setTargetBranch", () => {
      commands.setTargetBranch();
    }));
  }, 3e3);
}
function findingMergeConflict(targetbranch) {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders) {
    vscode.window.showErrorMessage("no workspace found");
    throw new Error("No workspace folders to open");
  }
  process.chdir(workspaceFolders[0].uri.path);
  const currentBranch = childprocess.execSync("git branch --show-current").toString().trim();
  const mergeBase = childprocess.execSync(`git merge-base HEAD ${targetbranch}`).toString().trim();
  const mergeResult = childprocess.execSync(`git merge-tree ${mergeBase} HEAD refs/heads/${targetbranch}`).toString().trim();
  if (mergeResult.includes("CONFLICT") || mergeResult.includes("=======")) {
    return {
      hasConflict: true,
      message: "Potential merge conflicts detected!!"
    };
  }
  return {
    hasConflict: false,
    message: "No merge conflicts detected!"
  };
}
function deactivate() {
}
module.exports = {
  activate,
  deactivate
};
