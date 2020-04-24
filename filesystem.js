const fs = require('fs');
function readFile (directory, options) {
  return new Promise ((resolve, reject) => {
    fs.readFile(directory, options, (err, data) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(data);
    });
  });
}
function writeFile (file, data, options) {
  return new Promise((resolve, reject) => {
    fs.writeFile(file, data, options, (err) => {
      if (err) {
        reject(err);
        return;
      }
      resolve();
    });
  });
}
module.exports = {
  "readFile": readFile,
  "writeFile": writeFile,
  "readFileSync": fs.readFileSync,
  "writeFileSync": fs.writeFileSync
};
