const yulp = require('yulp');
const fs = require('fs');


fs.readdir("./Yul+ Contracts/", (err, files) => {
    files.forEach(file => {
        fs.readFile("./Yul+ Contracts/" +file, 'utf8', function (err,data) {
            if (err) {
                return console.log(err);
            }
            let filename = file.split(".")
            let source = yulp.compile(data);
            fs.writeFile("./contracts/" + filename[0] + '.yul', yulp.print(source.results), (err) => {
                // In case of a error throw err.
                if (err) throw err;
            })
        });
    });
});
