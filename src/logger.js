const path = require('path');
const fs = require('fs');
const vscode = require('vscode');

/**
 * @param {string} gitpath
 * @param {string} commitMsg
 */
function logCommit(gitpath, commitMsg) {
	const logMessage = `${commitMsg.split('commit: ')[1]} on ${new Date()}`;
	let gitParentPath = path.dirname(gitpath);
	const logDir = path.join(gitParentPath, 'commit_logs');
	const logFile = path.join(logDir, 'logs.txt');
	if(!fs.existsSync(logDir)) {
		const response = fs.mkdirSync(logDir, { recursive: true });
	}
	const stream = fs.createWriteStream(logFile, { flags: 'a' });
	stream.write(`${logMessage} \n`);
	vscode.window.showInformationMessage(logMessage);
	process.on('exit', () => stream.end());
}

module.exports = {
    logCommit
}