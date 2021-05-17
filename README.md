# VSCode Ansible Vault extension

[![Version Badge](https://img.shields.io/vscode-marketplace/v/flaunay.ansible-vault.svg?style=flat-square&label=marketplace)](https://marketplace.visualstudio.com/items?itemName=flaunay.ansible-vault)
[![Installs Badge](https://img.shields.io/vscode-marketplace/i/flaunay.ansible-vault.svg?style=flat-square)](https://marketplace.visualstudio.com/items?itemName=flaunay.ansible-vault)
[![Rating Badge](https://img.shields.io/vscode-marketplace/r/flaunay.ansible-vault.svg?style=flat-square)](https://marketplace.visualstudio.com/items?itemName=flaunay.ansible-vault)
[![License Badge](https://img.shields.io/badge/License-MPL%202.0-blue.svg?style=flat-square)](https://www.mozilla.org/en-US/MPL/2.0/)

> **Note** : This extension has been deprecated in favor of the [vscode-ansible](https://marketplace.visualstudio.com/items?itemName=zbr.vscode-ansible) extension. Vault encryption/decryption feature is now part of it. Please uninstall this one.

VSCode extensions to encrypt/decrypt `ansible-vault` file as well as selected text, using ansible vault-id instead of password file or password as compared with other existing extensions. Can toggle with <kbd>`ctl+alt+0`</kbd>, on macOS with <kbd>`cmd+alt+0`</kbd>, or via the contextual menu.

_Fork of [spinosae/vscode-ansible-vault](https://github.com/spinosae/vscode-ansible-vault), which in turn was inspired by [wolfmah/vscode-ansible-vault-inline](https://gitlab.com/wolfmah/vscode-ansible-vault-inline), which in turn was inspired by [dhoeric/vscode-ansible-vault](https://github.com/dhoeric/vscode-ansible-vault), which in turn was inspired by [sydro/atom-ansible-vault](https://github.com/sydro/atom-ansible-vault)_


## Usage

Specify your vault passwords in `vault_identity_list` in ansible.cfg or in `ANSIBLE_VAULT_IDENTITY_LIST` environment variable and choose the one you want to use when prompted.

## Requirements

- Ansible

## Developement

### Build

```
npm install
npm run compile
```

### Publish

* Change version
```
npm version [major|minor|patch] --no-git-tag-version
```
* Update `CHANGELOG.md`
* Publish the extension. See documentation for more info on how to login and for more advance options: [VSCode: Publishing Extension](https://code.visualstudio.com/api/working-with-extensions/publishing-extension).
```
vsce publish --pat X_PERSONAL_ACCESS_TOKEN_X
```
* Create a tag
```
git tag x.x.x
git push origin x.x.x
```
