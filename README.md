# kaholo-plugin-cmd
CMD plugin for Kaholo

## Methods and Parameters

### Method: Execute
**Description:**

This method will execute a command line

**Parameter:**
1. The command to execute.

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
1. Command - The command to execute remotly
2. Remote User - The user to connect to the remote server
3. Remote Password - The password to connect to the remote server
4. Path to Key - a path to the key file such as SSH key.

### Method: Execute command Multiple times.
**Description:**
This method will execute a single command multiple times.

**Parameters:**
1. Command - the command to execute.
2. Number of times - how many times to execute the command



