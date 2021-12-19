const yulp = require('yulp');
const fs = require('fs');
const { format } = require('path');
const { exec } = require('child_process');
const { stderr } = require('process');
const solc = require('solc');

/*
  Yul Log is my own toolchain for compiling Yul+ Contracts capable of handing a full 1 and a half frameworks



*/

fs.readdir("./Yul+ Contracts/", (err, files) => {
    files.forEach(file => {
        fs.readFile("./Yul+ Contracts/" +file, 'utf8', function (err,data) {
            if (err) {
                return console.log(err);
            }
            let filename = file.split(".")
            let source = yulp.compile(data);
            let output = JSON.parse(solc.compile(JSON.stringify({
                "language": "Yul",
                "sources": { "Target.yul": { "content": yulp.print(source.results) } },
                "settings": {
                  "outputSelection": { "*": { "*": ["*"], "": [ "*" ] } },
                  "optimizer": {
                    "enabled": true,
                    "runs": 0,
                    "details": {
                      "yul": true
                    }
                  }
                }
              })));  

            let contractObjects = Object.keys(output.contracts["Target.yul"])
            let abi = source.signatures.map(v => v.abi.slice(4, -1)).concat(source.topics.map(v => v.abi.slice(6, -1)))
            let bytecode = "0x" + output.contracts["Target.yul"][contractObjects[0]]["evm"]["bytecode"]["object"];
            let deployedBytecode = "0x" + output.contracts["Target.yul"][contractObjects[0]]["evm"]["deployedBytecode"]["object"];
            if (process.argv.indexOf('hardhat') > -1){
              // if hardhat flag is present
              var hardhatCompiled = {
                  "_format": "hh-sol-artifact-1",
                  "sourceName" : filename,
                  "abi" : abi,
                  "bytecode" : bytecode,
                  "linkReferences": {}, // I really don't know what this means
                  "deployedLinkReferences": {} // This either
              }
              const data = JSON.stringify(hardhatCompiled);
              fs.writeFile("./build/" + "contracts/" + filename[0] + '.json', data, (err) => {
                  // In case of a error throw err.
                  if (err) throw err;
              })
            } else if(process.argv.indexOf('truffle') > -1){
              // Write compiled Yul to a Contract 
              fs.writeFile("./contracts/" + filename[0] + '.yul', yulp.print(source.results), (err) => {
                // In case of a error throw err.
                if (err) throw err;
              })
              let abiBlock = ""
              for (let i = 0; i < abi.length; i++) {
                if (abi[i].indexOf("returns") < -1 && abi[i].substring(0, 5) != "event"){
                  abiBlock += abi[i] + "external" +";" + "\n"
                } else {
                    if(abi[i].substring(0, 5) != "event"){
                    //function get() returns (uint256);
                    splitABI = String(abi[i]).split(" ")
                    closeIndex = abi[i].indexOf(")")
                    let funcName = String(abi[i]).substring(0, closeIndex+1) + " external " + String(abi[i]).substring(closeIndex+1, String(abi[i]).length)
                    abiBlock += funcName +";" + "\n"
                  } else {
                    // Handle if its an event
                    abiBlock += abi[i] + ";"

                  }
                }
              } 
              // Convert abi to a solidity like interface
              abi = "pragma solidity ^0.8.10;\n interface " + "YulpInterface" + "{\n" + abiBlock + "\n}"
              // Write abi to an interface then compile that
              let compiledInterface = JSON.parse(solc.compile(JSON.stringify({
                "language": "Solidity",
                "sources": { "Target.sol": { "content": abi } },
                "settings": {
                  "outputSelection": { "*": { "*": ["*"], "": [ "*" ] } },
                  "optimizer": {
                    "enabled": true,
                    "runs": 0,
                    "details": {
                      "yul": false
                    }
                  }
                }
              })));  
              let compiledABI = compiledInterface.contracts["Target.sol"]["YulpInterface"]["abi"]
              // Next run truffle compile
              exec("truffle compile", (error, stdout, stderr) => {
                console.log(stdout)
                // Next read the created .json file, and inject abi into it
                const data = JSON.parse(fs.readFileSync("./build/contracts/" + filename[0] + ".json"))
                data.abi = compiledABI
                data.deployedBytecode = deployedBytecode
                fs.writeFileSync("./build/contracts/" + filename[0] + ".json", JSON.stringify(data, null, 4));
              });
        }
    });
  });
})
