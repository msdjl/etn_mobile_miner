const stackTrace = require('stack-trace');

class Logger {
    constructor(prefix) {
        this.prefix = prefix;
    }

    log(...lines) {
        this.print('log', lines);
    }

    error(...lines) {
        this.print('error', lines);
    }

    print(method, lines) {
        console.log(new Date(), this.prefix, stackTrace.get()[2].getFunctionName() + '()');
        lines.forEach((el) => console[method](el));
        console.log('');
    }
}

module.exports = Logger;