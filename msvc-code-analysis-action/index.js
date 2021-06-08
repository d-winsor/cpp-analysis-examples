const core = require('@actions/core');
const github = require('@actions/github');
const fs = require('fs');
const path = require('path');
const which = require('which');

var clArgs = ["/analyze:quiet", "/analyze:log:format:sarif"];

function prepareOutputDir() {
  var outputDir = core.getInput('sarif-output');
  if (outputDir == '') {
    throw 'sarif-output folder not set';
  }

  // make relative path relative to the repo root
  if (!path.isAbsolute(outputDir)) {
    outputDir = path.join(process.env.GITHUB_WORKSPACE, outputDir);
  }

  // ensure output folder has trailing slash for use in MSVC arguments
  if (!outputDir.endsWith('\\') && !outputDir.endsWith('/')) {
    outputDir = outputDir + '\\';
  }

  // create output folder if it doesn't already exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // delete existing Sarif files
  files = fs.readdirSync(outputDir, { withFileTypes: true });
  files.forEach(file => {
    if (file.isFile() && path.extname(file.name).toLowerCase() == '.sarif') {
      fs.unlinkSync(path.join(outputDir, file.name));
    }
  });

  return outputDir;
}

function findMSVC() {
  var clPath = '';
  which('cl.exe', function(err, clPath) {
      if (err) throw err;
  });

  // TODO: version check MSVC compiler
  var version = '';

  return version;
}

try { 
    var version = findMSVC();
    var outputDir = prepareOutputDir();

    // TODO: find EspXEngine.dll assuming Visual Studio compiler layout

    // redirect all analysis log files to 
    clArgs.push('/analyze:log' + outputDir);

    // add analysis arguments to _CL_ env variable
    core.exportVariable('_CL_', clArgs.join(' '));
} catch (error) {
  core.setFailed(error.message);
}