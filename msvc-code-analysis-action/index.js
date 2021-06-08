const core = require('@actions/core');
const github = require('@actions/github');
const fs = require('fs');
const path = require('path');
const which = require('which');

var clArgs = ["/analyze:quiet", "/analyze:log:format:sarif"];

try { 
    // collect inputs
    const outputFolder = core.getInput('sarif-output');

    // ensure output folder has trailing slash for use in MSVC arguments
    if (!outputFolder.endsWith('\\') && !outputFolder.endsWith('/')) {
      outputFolder = outputFolder + '\\';
    }

    // find MSVC compiler
    var clPath;
    which('cl.exe', function(err, clPath) {
      if (err) throw err;
    });

    // TODO: version check MSVC compiler

    // TODO: find EspXEngine.dll assuming Visual Studio compiler layout

    // redirect all analysis log files to 
    clArgs.push('/analyze:log' + outputFolder);

    // create output folder if it doesn't already exist
    fs.mkdirSync(outputFolder);

    // delete existing Sarif files in sarif-output folder
    fs.readdirSync(outputFolder, (err, files) => {
      if (err) throw err;
      for (const file of files) {
        if (path.extname(file).toLowerCase() == 'sarif') {
          fs.unlinkSync(path.join(directory, file), err => {
            if (err) throw err;
          });
        }
      }
    });

    // add analysis arguments to _CL_ env variable
    core.exportVariable('_CL_', clArgs.join(' '));
} catch (error) {
  core.setFailed(error.message);
}