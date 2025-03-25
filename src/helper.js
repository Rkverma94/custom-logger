const vscode = require('vscode');
const path = require('path');
const fs = require('fs');

function searchForDirectory() {
	const workspaceFolder = vscode.workspace.workspaceFolders;
	if(!workspaceFolder) {
		vscode.window.showErrorMessage('No workspace folder found.');
		throw new Error('No workspace folders to open');
	}
	vscode.window.showInformationMessage('Workspace folder is found');
	for(let folder of workspaceFolder) {
		const folderPath = folder.uri.path;
		let curDir = folderPath;
		while(true) {
			const gitPath = path.join(curDir, '.git');
			if(fs.existsSync(gitPath) && fs.statSync(gitPath).isDirectory()) {
				console.log('git path found!!!');
				return gitPath;
			}
			const parentDir = path.dirname(curDir);
			if(parentDir == curDir) break;
			curDir = parentDir;
		}
	}
	console.log('no git found');
	return null;
}

module.exports = {
    searchForDirectory
}