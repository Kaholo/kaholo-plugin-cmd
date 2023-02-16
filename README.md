# Kaholo Command Line Plugin
Execute commands using the standard linux Bourne (/bin/sh) or Bash (/bin/bash) shells or Windows cmd.exe on the Kaholo agent. These commands are executed locally on the Kaholo agent. To execute commands on remote machines please use the [Kaholo SSH plugin](https://github.com/Kaholo/kaholo-plugin-ssh/releases) instead. Method **Remote Command Execution** is intended only for backward compatibility with earlier versions of this plugin.

**Note: Interactive commands should not be used. If a command prompts for user input during an execution it will wait until the pipeline execution times out or gets stopped. Default timeout is 10 minutes.**

For example, do not run commands like `rm -r *`, but instead use `rm -rf *`. The extra `-f` causes the command to never prompt for confirmation.

There is no need to `sudo` when using this plugin. All commands run on the Kaholo agent as user `root` already.

The command will run by default in the default working directory on the Kaholo agent, e.g. `/twiddlebug/workspace`. If running in an alternative directory is useful, use the **Working Directory** parameter or accommodate that in the command. For example the following two configurations are equivalent:

    Working Directory: (null)
    Command: `rm -rf testresults/koda22/*`

    Working Directory: `testresults/koda22`
    Command: `rm -rf *`

Both configurations delete everything in directory `/twiddlebug/workspace/testresults/koda22` on the Kaholo Agent.

Commonly used command examples:
* Install a tool on the Kaholo agent (Alpine Linux): `apk add maven`
* List files in the Kaholo Agent default working directory: `ls -la`
* Pause the pipeline for 30 seconds: `sleep 30`
* Expose a link in Kaholo Final Results: echo `"<a href=\"http://34.88.170.156:8081\" target=\"_blank\">Pet Clinic App</a><br>"`
* Downloading files: `wget https://github.com/PowerShell/v7.3.2/powershell-7.3.2-linux-alpine-x64.tar.gz`
* Running a CLI tool (must be installed on Kaholo Agent) for which there is no Kaholo plugin: `puppet apply environments/production/manifests/site.pp`

## Method: Execute Command
Execute the specified command from shell. You can also run multiple commands that will be executed under the same context.

### Parameter: Working Directory ###
If a directory on the Kaholo agent is specified, either relative to default or absolute, the command is executed in the specified directory.
### Parameter: Command ###
The command or commands to execute. Entering one command on each line. The commands will be executed sequentially regardless the outcome of previous commands.

### Parameter: Finish Signal ###
By default the plugin waits until the shell emits an exit event. To wait for a close event, select **Close** instead.

### Parameter: Shell Type ###
For linux the default shell is `/bin/sh`. Use this parameter to select `/bin/bash` or `cmd.exe` (Windows Agents only) instead, if required.

## Method: Remote Command Execution
**This method is deprecated** in favor of the [Kaholo SSH plugin](https://github.com/Kaholo/kaholo-plugin-ssh/releases). It is provided and works as before for backward compatibility purposes only.

### Parameters
1. Private SSH key (Vault) - **Optional** - An SSH private key stored in the Kaholo vault.
2. Key Path (String) - **Optional** - The path of the key to use to authenticate with to remote server using SSH.
3. Key Passphrase (Vault) - **Optional** - The passphrase if the SHH key has one, stored in the Kaholo vault.
4. Remote User (String) **Required** - The SSH username to use to authenticate to the remote host.
5. Remote Address (String) **Required** - The URL of the host to execute the command on.
6. Port (String) **Optional** - The port used to connect with SSH to the remote host.
7. Command (String) **Required** - The command to execute on the remote host.

## Method: Execute Command Multiple Times
Execute the given command for a specified number of times.

### Parameter: Command
The command to execute.

### Parameter: Number of Times
The number of times to execute the command.

## Method: Execute Windows Desktop commands
(Windows agents only) Execute interactive desktop commands while running an agent as a Windows service.

### Parameter: Command
The command to execute.
### Parameter: Working Directory
If specified, execute the command from the specified directory.

## Method: Execute Script by Path
If an executable script already exists on the agent, provide the path to the script and this method will execute it. A common way to place a script on the Kaholo Agent is the Git Plugin (clone a repository) or the Text File Plugin, which can write a provided script to a file.

### Parameter: Path
The path on the Kaholo Agent to the script to execute.
