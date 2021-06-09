const core = require('@actions/core');
const fs = require('fs');
const path = require('path');
const util = require('util');

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
  var paths = process.cwd() + ';' + process.env.PATH;
  clPath = '';

  for (const pathDir of paths.split(';')) {
    const clPath = path.join(pathDir, 'cl.exe');
    if (fs.existsSync(clPath)) {
      return clPath;
    }
  }

  throw 'cl.exe is not accessible on the PATH';
}

// EspXEngine.dll only exists in host/target bin for MSVC Visual Studio release
function getEspXEngine(clPath) {
  var clDir = path.dirname(clPath);

  // check if we already have the correct host/target pair
  var dllPath = path.join(clDir, 'EspXEngine.dll');
  if (fs.existsSync(dllPath)) {
    return dllPath;
  }

  var targetName = '';
  var hostDir = path.dirname(clDir);
  switch (path.basename(hostDir)) {
    case 'HostX86':
      targetName = 'x86';
      break;
    case 'HostX64':
      targetName = 'x64';
      break;
    default:
      throw 'Unknown MSVC toolset layout';
  }

  dllPath = path.join(hostDir, targetName, 'EspXEngine.dll');
  if (!fs.existsSync(dllPath)) {
    throw 'Unable to fine EspXEngine.dll';
  }

  return dllPath;
}

try { 
    var clPath = findMSVC();
    // TODO: version check MSVC compiler
    clArgs.push(util.format('/analyze:plugin"%s"', getEspXEngine(clPath)));

    var outputDir = prepareOutputDir();
    clArgs.push(util.format('/analyze:log"%s"', outputDir));

    // TODO: ruleset handling

    // add analysis arguments to _CL_ env variable
    core.exportVariable('_CL_', clArgs.join(' '));
} catch (error) {
  core.setFailed(error.message);
}