// src/extension.js
var vscode = require("vscode");
var fs = require("fs");
var path = require("path");
var childprocess = require("node:child_process");
function activate(context) {
  setTimeout(() => {
    const gitExtension = vscode.extensions.getExtension("vscode.git")?.exports;
    const git = gitExtension?.getAPI(1);
    if (!git) {
      vscode.window.showErrorMessage("Git Extension API not available.");
      return;
    }
    vscode.window.showInformationMessage("Git Extension found!!");
    console.log("git : ", git);
    console.log("git repositories length : ", git.repositories);
    let gitpath = searchForDirectory();
    const headPath = path.join(gitpath, "logs", "HEAD");
    if (fs.existsSync(headPath)) {
      fs.watch(headPath, (eventType) => {
        if (eventType == "change") {
          const logData = fs.readFileSync(headPath, "utf-8");
          const lastLine = logData.trim().split("\n").pop();
          logCommit(gitpath, lastLine);
          const res = findingMergeConflict("master");
          vscode.window.showInformationMessage(res.message);
        }
      });
    }
    console.log('Congratulations, your extension "custom-logger" is now active!');
    context.subscriptions.push(vscode.commands.registerCommand("custom-logger.helloWorld", function() {
      vscode.window.showInformationMessage("Hello World from custom-logger!");
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
  console.log(`current-branch : ${currentBranch}`);
  const mergeBase = childprocess.execSync(`git merge-base HEAD ${targetbranch}`).toString().trim();
  console.log(`merge base : ${mergeBase}`);
  const mergeResult = childprocess.execSync(`git merge-tree ${mergeBase} HEAD refs/heads/${targetbranch}`).toString().trim();
  console.log(`mergeResult : ${mergeResult}`);
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
function searchForDirectory(dir = process.cwd()) {
  const workspaceFolder = vscode.workspace.workspaceFolders;
  if (!workspaceFolder) {
    vscode.window.showErrorMessage("No workspace folder found.");
    throw new Error("No workspace folders to open");
  }
  vscode.window.showInformationMessage("Workspace folder is found");
  for (let folder of workspaceFolder) {
    const folderPath = folder.uri.path;
    let curDir = folderPath;
    while (true) {
      const gitPath = path.join(curDir, ".git");
      if (fs.existsSync(gitPath) && fs.statSync(gitPath).isDirectory()) {
        console.log("git path found!!!");
        return gitPath;
      }
      const parentDir = path.dirname(curDir);
      if (parentDir == curDir) break;
      curDir = parentDir;
    }
  }
  console.log("no git found");
  return null;
}
function logCommit(gitpath, commitMsg) {
  const logMessage = `${commitMsg.split("commit: ")[1]} on ${/* @__PURE__ */ new Date()}`;
  let gitParentPath = path.dirname(gitpath);
  const logDir = path.join(gitParentPath, "commit_logs");
  const logFile = path.join(logDir, "logs.txt");
  if (!fs.existsSync(logDir)) {
    const response = fs.mkdirSync(logDir, { recursive: true });
  }
  const stream = fs.createWriteStream(logFile, { flags: "a" });
  stream.write(`${logMessage} 
`);
  vscode.window.showInformationMessage(logMessage);
  process.on("exit", () => stream.end());
}
function deactivate() {
}
module.exports = {
  activate,
  deactivate
};
