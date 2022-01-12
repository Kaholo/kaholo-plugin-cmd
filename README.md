# kaholo-plugin-cmd
Kaholo plugin to execute commands from shell.

## Method: Execute Command
Execute the specified command from shell.

### Parameters
1. Working Directory (String) **Optional** - If specified, execute the command from the specified directory.
2. Command (String) **Required** - The command to execute.
3. Finish Signal (Options) **Optional** - If Close is selected wait until a 'close' event is emitted. If Exit is selected, waits until an 'exit' event is emitted instead. Default is Exit.
4. Shell Type (Options) **Optional** - For linux specifies whether to use bin/sh or bin/bash as the shell. For windows only default cmd.exe is available. **Possible values: Default | sh | bash**.
* For linux default shell is **sh**.
* **Don't use sh or bash shell on Windows agents!**


## Method: Execute Multiple Commands
Execute multiple commands from shell.

### Parameters
1. Commands (Text) **Required** - The commands to execute. To enter multiple commands seperate each with a new line.

## Method: Remote Command Execution
Execute the specified command on the shell of the specified remote host, using SSH.

### Parameters
1. Key Path (String) **Required** - The path of the key to use to authenticate with to remote server using SSH.
2. Remote User (String) **Required** - The SSH username to use to authenticate to the remote host.
3. Remote Address (String) **Required** - The URL of the host to execute the command on.
4. Port (String) **Optional** - The port used to connect with SSH to the remote host.
5. Command (String) **Required** - The command to execute on the remote host.

## Method: Execute Command Multiple Times
Execute the specified command the specified number of times.

### Parameters
1. Command (String) **Required** - The command to execute.
2. Number Of Times (String) **Required** - Number of times to execute the command.

## Method: Execute windows interactive
Execute desktop interactive commands while running an agent as a windows service.

### Parameters
1. Command (String) **Required** - The command to execute.
2. Working Directory (String) **Optional** - If specified, execute the command from the specified directory.
