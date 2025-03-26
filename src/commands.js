const vscode = require('vscode');
const child_process = require('node:child_process');
const helper = require('./helper.js');
let targetBranch = "";

async function setTargetBranch() {
    await helper.setCurrentDirectory();
    const branches = await getGitBranches();
    const targetBranch = await vscode.window.showQuickPick(branches, {
        placeHolder: "Select a target branch to merge",
    });
    if(targetBranch) {
        vscode.window.showInformationMessage(`Selected target branch: ${targetBranch}`);
        return targetBranch;
    }
    return null;
}

function getGitBranches() {
    return new Promise((resolve, reject) => {
        child_process.exec("git branch -l", (error, res) => {
            if(error) {
                vscode.window.showErrorMessage(`Error fetching branches ${JSON.stringify(error)}`);
                reject(error);
            } else {
                resolve(res.split("\n").map(branch => branch.trim()).filter(branch => branch));
            }
        });
    });
}

module.exports = {
    setTargetBranch,
    targetBranch
}