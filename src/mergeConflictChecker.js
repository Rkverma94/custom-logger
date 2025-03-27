const commands = require('./commands.js');
const vscode = require('vscode');
const childprocess = require('node:child_process');

function findingMergeConflict() {
	let targetBranch = commands.getTargetBranch();
	if(!targetBranch) {
		vscode.window.showErrorMessage(`target branch is not set`);
		return;
	}
	const workspaceFolders = vscode.workspace.workspaceFolders;
	if(!workspaceFolders) {	
		vscode.window.showErrorMessage('no workspace found');
		throw new Error('No workspace folders to open');
	}
	process.chdir(workspaceFolders[0].uri.path);
	childprocess.execSync(`git fetch origin ${targetBranch}`);
	const currentBranch = childprocess.execSync("git branch --show-current").toString().trim();
	console.log(`currentbranch : ${currentBranch}, target branch : ${targetBranch}`);
	//finding common ancestor - basically we are finding common commit for both branch
	const mergeBase = childprocess.execSync(`git merge-base HEAD ${targetBranch}`).toString().trim();
	console.log(`merge base : ${mergeBase}`);
	const mergeResult = childprocess.execSync(`git merge-tree ${mergeBase} HEAD origin/${targetBranch}`).toString().trim();
	console.log(`mergeResult : ${mergeResult}`);
	//Check for conflict markers
	if(mergeResult.includes("CONFLICT") || mergeResult.includes("=======")) {
		return {
			hasConflict : true,
			message : "Potential merge conflicts detected!!"
		}
	}
	return {
		hasConflict : false,
		message : "No merge conflicts detected!"
	}
}

module.exports = {
    findingMergeConflict
}