# 🪄 Backups Command Line Interface

### 🖼 For Windows users

For the best experience, please consider using the **Windows Terminal** app to interact with Backups CLI. It comes pre-installed with Windows 11, on Windows 10 you can get it [here](https://aka.ms/terminal).

### 🐳 Using with Docker (recommended)

If you already have configured the environment, you can simply access Backups CLI by executing the following command in your shell from the project root:

```bash
yarn cli
```

You can also launch Backups CLI with expert mode enabled, and it will remain so until the end of the session.

```bash
yarn cli:expert
```

**⚠ Warning! Don't use expert mode if you're not sure what you're doing.**

When you're done with using Backups CLI, choose `🚪 Exit Backups CLI` from the menu or press **CTRL + C** to exit it.

### 🤠 Using without Docker

You can launch Backups CLI without Docker by navigating to backups-cli package directory and executing the start script:

```bash
cd packages/backups-cli/ && yarn start
```

You can also enable expert mode:

```bash
touch ~/.backups-cli-expert-mode
```

**⚠ Warning! This will enable expert mode permanently. Don't use it if you're not sure what you're doing.**

To disable expert mode, simply use:

```bash
rm -f ~/.backups-cli-expert-mode
```

Remember that for Backups CLI to function properly without Docker, you need to make sure that you're running at least **Node.js version 18 or greater**.

When you're done with using Backups CLI, choose `🚪 Exit Backups CLI` from the menu or press **CTRL + C** to exit it.
