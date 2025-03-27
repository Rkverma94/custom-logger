const vscode = require('vscode');
const fs = require('fs')
const path = require('path');
const childprocess = require('node:child_process');
const logger = require('./logger.js');
const helper = require('./helper.js');
const commands = require('./commands.js');
const findingMergeConflict = require('./mergeConflictChecker.js');
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
					const res =  findingMergeConflict.findingMergeConflict();
					if(res.hasConflict) {
						vscode.window.showErrorMessage(res.message);
					} else {
						vscode.window.showInformationMessage(res.message);
					}
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

 

// This method is called when your extension is deactivated
function deactivate() {}

module.exports = {
	activate,
	deactivate
}
