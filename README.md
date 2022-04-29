# kaholo-plugin-cmd
Kaholo plugin to execute commands from shell.

**Note: Timeout errors may happen if the command runs interactively as it waits for an input. In this case, try adding a flag (-y) to run the command without interactive prompts.**

**For example, if you need to install a package on the Kaholo agent, use bash command  ```apt install <package> -y``` (or use the interactive method for command execution).**

## Method: Execute Command
Execute the specified command from shell. You can also run multiple commands that will be executed under the same context.

### Parameters
1. Working Directory (String) **Optional** - If specified, execute the command from the specified directory.
2. Command (Text) **Required** - The command or commands to execute. When entering multiple commands, seperate each command with a new line. The commands will be executed sequentially regardless if the previous command was successfully executed or not.
3. Finish Signal (Options) **Optional** - If Close is selected, waits until a 'close' event is emitted. If Exit is selected, waits until an 'exit' event is emitted instead. **Default value is Exit**.
4. Shell Type (Options) **Optional** - For linux, specifies whether to use bin/sh or bin/bash as the shell. For Windows, only default cmd.exe is available. **Possible values: Default | sh | bash**.
* For linux, default shell is **sh**.
* **Don't use sh or bash shell on Windows agents!**

## Method: Remote Command Execution
Execute the specified command on the shell of the specified remote host, using SSH.

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

### Parameters
1. Command (String) **Required** - The command to execute.
2. Number Of Times (String) **Required** - Number of times to execute the command.

## Method: Execute windows interactive
Execute desktop interactive commands while running an agent as a Windows service.

### Parameters
1. Command (String) **Required** - The command to execute.
2. Working Directory (String) **Optional** - If specified, execute the command from the specified directory.
