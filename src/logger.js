const path = require('path');
const fs = require('fs');
const vscode = require('vscode');
const childprocess = require('node:child_process');

/**
 * @param {string} gitpath
 * @param {string} commitMsg
 */
function logCommit(gitpath, commitMsg) {
    let messageObj = {};
    messageObj.message = commitMsg.split('commit: ')[1];
    messageObj.date = new Date();
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if(!workspaceFolders) {	
        vscode.window.showErrorMessage('no workspace found');
        throw new Error('No workspace folders to open');
    }
    process.chdir(workspaceFolders[0].uri.path);
    messageObj.branchName = childprocess.execSync("git branch --show-current").toString().trim();
    let gitParentPath = path.dirname(gitpath);
	const logDir = path.join(gitParentPath, 'commit_logs');
	const logFile = path.join(logDir, 'logs.json');
	if(!fs.existsSync(logDir)) {
		const response = fs.mkdirSync(logDir, { recursive: true });
	}
    if(!fs.existsSync(logFile)) {
        fs.writeFileSync(logFile, JSON.stringify(messageObj), 'utf-8');
    } else {
        const fileContent = fs.readFileSync(logFile, 'utf-8');
        const jsonData = fileContent ? JSON.parse(fileContent) : []

        if(Array.isArray(jsonData)) {
            jsonData.push(messageObj);
        }

        fs.writeFileSync(logFile, JSON.stringify(jsonData), 'utf-8');
    }
	vscode.window.showInformationMessage(`commit logged at ${new Date()}`);
}

module.exports = {
    logCommit
}