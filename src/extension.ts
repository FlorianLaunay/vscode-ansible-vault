import * as vscode from 'vscode';
import * as tmp from 'tmp';
import * as child_process from 'child_process';
import * as fs from "fs";
import * as util from './util';

async function ask_for_vault_id(ansible_cfg: string) {
	let vault_id: string = "default";
	if (ansible_cfg == "ANSIBLE_VAULT_IDENTITY_LIST") {
		let env_var : any = process.env.ANSIBLE_VAULT_IDENTITY_LIST;
		var identity_list = env_var.split(',').map( (id : string) => id.split('@', 2)[0].trim());
	} else {
		let cfg : any = util.getValueByCfg(ansible_cfg);
		var identity_list = cfg.defaults.vault_identity_list.split(',').map( (id : string) => id.split('@', 2)[0].trim());
	}
	await vscode.window.showQuickPick(identity_list)
		.then( chosen => { if (chosen) { vault_id = chosen; } } );
	return vault_id;
}

export function activate(context: vscode.ExtensionContext) {
	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "ansible-vault-inline" is now active!');

	var toggleEncrypt = async () => {
		let editor = vscode.window.activeTextEditor;
		if (!editor) {
			return;
		}

		let selection = editor.selection;
		if (!selection) {
			return;
		}

		let config = vscode.workspace.getConfiguration('ansibleVaultInline');
		let doc = editor.document;
		let keypath = "";
		let pass : any = "";

		// Read `ansible.cfg` or environment variable
		let rootPath = util.getRootPath(editor.document.uri);
		if (!!process.env.ANSIBLE_VAULT_IDENTITY_LIST) {
			var keyInCfg = "ANSIBLE_VAULT_IDENTITY_LIST";
		} else {
			var keyInCfg = util.scanAnsibleCfg(rootPath);
		}

		// Extract `ansible-vault` password
		if (!!keyInCfg) {
			console.log(`Getting vault keyfile from ${keyInCfg}`);
			vscode.window.showInformationMessage(`Getting vault keyfile from ${keyInCfg}`);
		} else {
			console.log(`Found nothing from config files`);
		}

		const text = editor.document.getText(selection);

		// Go encrypt / decrypt
		if (!!text) {
			let type = getInlineTextType(text);

			if (type === 'plaintext') {
				console.log(`Encrypt selected text`);
				let vault_id : string = await ask_for_vault_id(keyInCfg);
				let encryptedText = "!vault |\n"+encryptInline(text, rootPath, vault_id, config);
				editor.edit(editBuilder => {
					editBuilder.replace(selection, encryptedText.replace(/\n/g,'\n'+" ".repeat(selection.start.character)));
				});
			} else if (type === 'encrypted') {
				console.log(`Decrypt selected text`);

				let decryptedText = decryptInline(text, rootPath, config);
				editor.edit(editBuilder => {
					editBuilder.replace(selection, decryptedText);
				});
			}
		} else {
			let content = '';
			await vscode.workspace.openTextDocument(doc.fileName).then((document) => {
				content = document.getText();
			});
			let type = getTextType(content);

			if (type === 'plaintext') {
				console.log(`Encrypt entire file`);
				let vault_id : string = await ask_for_vault_id(keyInCfg);
				encryptFile(doc.fileName, rootPath, vault_id, config);
				vscode.window.showInformationMessage(`File encrypted: '${doc.fileName}'`);
			} else if (type === 'encrypted') {
				console.log(`Decrypt entire file`);

				decryptFile(doc.fileName, rootPath, config);
				vscode.window.showInformationMessage(`File decrypted: '${doc.fileName}'`);
			}
			vscode.commands.executeCommand('workbench.action.files.revert');
		}
	};

	let disposable = vscode.commands.registerCommand('extension.ansibleVaultInline', toggleEncrypt);
	context.subscriptions.push(disposable);
}

export function deactivate() {}

// Returns wheter the selected text is encrypted or in plain text.
let getInlineTextType = (text : string) => {
	if (text.trim().startsWith('!vault |')) {
		text = text.replace('!vault |', '');
	}

	return (text.trim().startsWith('$ANSIBLE_VAULT;')) ? 'encrypted' : 'plaintext';
};

// Returns wheter the file is encrypted or in plain text.
let getTextType = (text : string) => {
	return (text.indexOf('$ANSIBLE_VAULT;') === 0) ? 'encrypted' : 'plaintext';
};

let encryptInline = (text : string, rootPath : string | undefined, vault_id : string, config : vscode.WorkspaceConfiguration) => {
	let tmpFilename = tmp.tmpNameSync();
	fs.writeFileSync(tmpFilename, Buffer.from(text, 'utf8'));
	console.log(`Wrote encrypted string to temporary file '${tmpFilename}'`);

	encryptFile(tmpFilename, rootPath, vault_id, config);
	let encryptedText = fs.readFileSync(tmpFilename, 'utf8');
	console.log(`encryptedText == '${encryptedText}'`);

	if (!!tmpFilename) {
		fs.unlinkSync(tmpFilename);
		console.log(`Removed temporary file: '${tmpFilename}'`);
	}

	return encryptedText.trim();
};

let decryptInline = (text : string, rootPath : string | undefined, config : vscode.WorkspaceConfiguration) => {
	// Delete inline vault prefix, then trim spaces and newline from the entire string and, at last, trim the spaces in the multiline string.
	text = text.replace('!vault |', '').trim().replace(/[^\S\r\n]+/gm, '');

	let tmpFilename = tmp.tmpNameSync();
	fs.writeFileSync(tmpFilename, Buffer.from(text, 'utf8'));
	console.log(`Wrote encrypted string to temporary file '${tmpFilename}'`);

	decryptFile(tmpFilename, rootPath, config);
	let decryptedText = fs.readFileSync(tmpFilename, 'utf8');
	console.log(`decryptedText == '${decryptedText}'`);

	if (!!tmpFilename) {
		fs.unlinkSync(tmpFilename);
		console.log(`Removed temporary file: '${tmpFilename}'`);
	}

	return decryptedText;
};

let encryptFile = (f : string, rootPath : string | undefined, vault_id : string, config : vscode.WorkspaceConfiguration) => {
	console.log(`Encrypt file: ${f}`);

	let cmd = `${config.executable} encrypt "${f}"`;
	cmd += ` --encrypt-vault-id="${vault_id}"`;

	if (!!rootPath) {
		exec(cmd, { cwd: rootPath });
	} else {
		exec(cmd);
	}
};

let decryptFile = (f : string, rootPath : string | undefined, config : vscode.WorkspaceConfiguration) => {
	console.log(`Decrypt file: ${f}`);

	let cmd = `${config.executable} decrypt "${f}"`;

	if (!!rootPath) {
		exec(cmd, { cwd: rootPath });
	} else {
		exec(cmd);
	}
};

let exec = (cmd : string, opt = {}) => {
	console.log(`> ${cmd}`);
	return child_process.execSync(cmd, opt);
};
