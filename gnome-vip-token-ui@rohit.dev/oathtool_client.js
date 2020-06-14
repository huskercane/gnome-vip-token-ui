const Util = imports.misc.util;
const GLib = imports.gi.GLib;
const Gio = imports.gi.Gio;
const ByteArrays = imports.byteArray;

const OATHTOOL = "/usr/bin/oathtool";

var OATHToolClient = class OATHToolClient {
    constructor(params) {
        let home_dir = GLib.get_home_dir();
        this.vip_token_file = home_dir + "/.vipaccess";
        this.fileExists = GLib.file_test(this.vip_token_file, GLib.FileTest.EXISTS);
        if (!this.fileExists) {
            log("LLL: throw " + this.fileExists);
        }
        this.base_32_secret = "";
        let fileContents = ByteArrays.toString(GLib.file_get_contents(this.vip_token_file)[1]);
        for (let fileContent of fileContents.split("\n")) {
            if (fileContent.includes('secret')) {
                this.base_32_secret = fileContent.split(' ')[1].trim();
            }
        }

    }


    get(callback) {
        execCommunicate([OATHTOOL, "-d6", "-b", "--totp", this.base_32_secret]).then(stdout => {
            // log(stdout);
            let results = [];
            results.push(stdout.trim());
            if (results.length > 0) {
                callback(results);
                return;
            }
            let message = "Nothing found";
            callback(message);
        }).catch(function(e) {
            log(e, "SOmethign went wrong");
            log(e.stack, "SOmethign went wrong");
        });
    }

    destroy() {
        delete this.vip_token_file;
        delete this.fileExists;
        delete this.base_32_secret;
    }

}

/**
 * Execute a command asynchronously and return the output from `stdout` on
 * success or throw an error with output from `stderr` on failure.
 *
 * If given, @input will be passed to `stdin` and @cancellable can be used to
 * stop the process before it finishes.
 *
 * @param {string[]} argv - a list of string arguments
 * @param {string} [input] - Input to write to `stdin` or %null to ignore
 * @param {Gio.Cancellable} [cancellable] - optional cancellable object
 * @returns {Promise<string>} - The process output
 */
async function execCommunicate(argv, input = null, cancellable = null) {
    let cancelId = 0;
    let flags = (Gio.SubprocessFlags.STDOUT_PIPE |
        Gio.SubprocessFlags.STDERR_PIPE);

    if (input !== null)
        flags |= Gio.SubprocessFlags.STDIN_PIPE;

    let proc = new Gio.Subprocess({
        argv: argv,
        flags: flags
    });
    proc.init(cancellable);

    if (cancellable instanceof Gio.Cancellable) {
        cancelId = cancellable.connect(() => proc.force_exit());
    }

    return new Promise((resolve, reject) => {
        proc.communicate_utf8_async(input, null, (proc, res) => {
            try {
                let [, stdout, stderr] = proc.communicate_utf8_finish(res);
                let status = proc.get_exit_status();

                if (status !== 0) {
                    throw new Gio.IOErrorEnum({
                        code: Gio.io_error_from_errno(status),
                        message: stderr ? stderr.trim() : GLib.strerror(status)
                    });
                }

                resolve(stdout.trim());
            } catch (e) {
                log(e);
                reject(e);
            } finally {
                if (cancelId > 0) {
                    cancellable.disconnect(cancelId);
                }
            }
        });
    });
}

// let oath_client = new OATHToolClient();
// oath_client.get(function (token) {
//     log(token);
// });
