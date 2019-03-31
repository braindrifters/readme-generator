#!/usr/bin/env node
const {genMd} = require('../lib/gen-read');

const processedOptions = (() => {
    let options = {};
    process.argv.filter((argument, index) => {
        const option = argument.match(/--(\w+)/)
        if(option)
            options[option[1]] = process.argv[index + 1];
        return argument
    });

    return options;
})();

genMd(processedOptions);
