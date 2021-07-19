# kaholo-plugin-cmd
CMD plugin for Kaholo

## Methods and Parameters

### Method: Execute
**Description:**

This method will execute a command line

**Parameter:**
1. Working Directory
2. Command to execute.
3. Wait for close - indicates rather exit event is enough or it should wait until all stdio are closed as well.

### Method: Execute Windows interactive
**Description:**

This is to execute desktop interactive commands while running an agent as windows service.

**Parameters:**
1. Command: The command to execute.
2. Working Directory: The directory to execute the command from (Optional).

### Method: Execute Windows script
**Description:**

This command is specifically to execute a batch file in windows.

**Parameters:**
1. Command: The script to execute.

### Method: Execute Commands
**Description:**

This method will exeucte multiple commands.

**Parameters:**
1. Commands to execute - split each command in a separate raw in the value area.

### Method: Remote Command Execute
**Description**
This method will execute a command line to a remote machine.

**Parameters:**
1. Key Path (String) **Optional** - A path to the key file such as SSH key.
2. Remote User (String) **Required** - The user to connect to the remote server
3. Remote Address (String) **Required** - The url of the remote Host to run the command on.
4. Port (Integer) **Optional** - The port to communicate with the remote host. Default value is 22;
4. Command (String) **Required** - The command to run on the remote server.

### Method: Execute command Multiple times.
**Description:**
This method will execute a single command multiple times.

**Parameters:**
1. Command - the command to execute.
2. Number of times - how many times to execute the command



