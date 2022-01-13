function joinCommand(command){
	let output = command.split('\n').map(item => item.trim()).join(' ; ')
	return output;
}

module.exports = {
    joinCommand
}