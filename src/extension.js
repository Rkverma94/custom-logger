const vscode = require('vscode');
const fs = require('fs')
const path = require('path');
const childprocess = require('node:child_process');
const logger = require('./logger.js');
const helper = require('./helper.js');
const commands = require('./commands.js');
/**
 * @param {vscode.ExtensionContext} context
 */
async function activate(context) {
	setTimeout(() => {
		const gitExtension = vscode.extensions.getExtension('vscode.git')?.exports;
		const git = gitExtension?.getAPI(1);
		if(!git) {
			vscode.window.showErrorMessage('Git Extension API not available.');
			return;
		} 
		vscode.window.showInformationMessage('Git Extension found!!');

		//make a file watcher for git log head
		let gitpath = helper.searchForDirectory();
		const headPath = path.join(gitpath, 'logs', 'HEAD');
		if(fs.existsSync(headPath)) {
			fs.watch(headPath, eventType => {
				if(eventType == 'change') {
					const logData = fs.readFileSync(headPath, 'utf-8');
					const lastLine = logData.trim().split('\n').pop();
					// console.log('lastline commit message : ', lastLine.split('commit: ')[1]);
					logger.logCommit(gitpath, lastLine);
					//run git merge --no-commit --no-ff <branch-name> 
					const res =  findingMergeConflict();
					vscode.window.showInformationMessage(res.message);
				}
			})
		}
		
		console.log('Congratulations, your extension "custom-logger" is now active!');
		context.subscriptions.push(vscode.commands.registerCommand('custom-logger.helloWorld', function () {
			vscode.window.showInformationMessage('Hello World from custom-logger!');
		}));


		context.subscriptions.push(vscode.commands.registerCommand('custom-logger.setTargetBranch', () => {
			commands.setTargetBranch();
		}));

	}, 3000);
}

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
	const currentBranch = childprocess.execSync("git branch --show-current").toString().trim();
	console.log(`currentbranch : ${currentBranch}, target branch : ${targetBranch}`);
	//finding common ancestor - basically we are finding common commit for both branch
	const mergeBase = childprocess.execSync(`git merge-base HEAD ${targetBranch}`).toString().trim();
	console.log(`merge base : ${mergeBase}`);
	const mergeResult = childprocess.execSync(`git merge-tree ${mergeBase} HEAD refs/heads/${targetBranch}`).toString().trim();

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

// This method is called when your extension is deactivated
function deactivate() {}

module.exports = {
	activate,
	deactivate
}
