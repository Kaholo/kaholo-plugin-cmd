const { Client } = require("ssh2");
const { handleChildProcess } = require("./helpers");

/**
 * Creates SSH Client
 * @param {import("ssh2").ConnectConfig} connectConfig
 * @returns {Client}
 */
function createSSHConnection(connectConfig) {
  const sshClient = new Client();
  return new Promise((res, rej) => { sshClient.connect(connectConfig).on("ready", () => res(sshClient)).on("error", rej); });
}

/**
 * Executes commands over SSH Client
 * @param {Client} sshClient
 * @param {string} cmd
 * @param {{ endConnectionAfter: boolean }} options
 */
function executeOverSSH(sshClient, cmd, { endConnectionAfter = true } = {}) {
  return new Promise((res, rej) => {
    sshClient.exec(cmd, (error, channel) => {
      if (error) return rej(error);
      if (endConnectionAfter) channel.on("close", () => sshClient.end());

      // handleChildProcess can be used here because the SSH Stream has the same
      // methods and the same events as the child process
      return handleChildProcess(channel, { finishSignal: "close" }).then(res).catch(rej);
    });
  });
}

module.exports = {
  executeOverSSH,
  createSSHConnection,
};
