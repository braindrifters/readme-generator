const path=require('path');
const fs=require('fs');
const scandir = process.cwd();


const pkg = require(path.resolve(scandir,'package.json'));
let package_manager = 'npm run';

/**
 * used to parse the dependencies and get the data to readme
 * @todo do a npm install if the folder not available
 * @param dependencies
 */
const parseDependencies = (dependencies) => (dependencies) ? Object.entries(dependencies).map(([key, value]) => {
        const file = path.resolve(scandir, `node_modules/${key}/package.json`);
        if(!fs.statSync(path.resolve(scandir, `node_modules/`)).isDirectory()){
            throw "run npm install first";
        }
        const pk1 = require(file);
        return [key, {
            version: value,
            actualVersion: pk1.version,
            description: pk1.description,
            author: pk1.author,
            repository: (typeof pk1.repository === "object") ? pk1.repository.url : pk1.repository
        }];
    }).reduce((all, [key, value]) => ({...all, ...{[key]: value}}), {}) : {};

/**
 * get the authors and process it
 * @param authors
 * @returns {*}
 */
const processAuthors = (authors) => {
        let resAuthors = [{
            "name": "",
            "email": ""
        }];
        if(!authors){
            return null;
        }
        if(authors instanceof Array){
            resAuthors = authors.map((author) => {
                if (typeof author === "string"){
                    let currentAuthor = author.match(/(.*?)(?:\s+)?<(.*?)>/);
                    return  {
                        "name": currentAuthor ? currentAuthor[1] : author,
                        "email": currentAuthor ? currentAuthor[2] : ""
                    }
                } else if(authors instanceof Object){
                    let currentAuthor = authors;
                    return  {
                        "name": currentAuthor.name,
                        "email": currentAuthor.email
                    }
                }
            })
        }
        else if(authors instanceof Object){
            let currentAuthor = authors;
            resAuthors =  [{
                "name": currentAuthor.name,
                "email": currentAuthor.email
            }]
        }
        else {
            let currentAuthor = authors.match(/(.*?)(?:\s+)?<(.*?)>/);
            resAuthors =  [{
                "name": currentAuthor ? currentAuthor[1] : authors,
                "email": currentAuthor ? currentAuthor[2] : ""
            }]
        }
        return resAuthors
    };


/**
 * read the package json and process it
 * @param pkg
 * @returns {{name, version, description, dependencies, devDependencies, engines: *, license: *, author: *, contributors: *, scripts: *}}
 */
const parseData =(pkg) => {
    if(pkg.engines && pkg.engines.yarn){
        package_manager = 'yarn';
    }
        return {
            "name" : pkg.name,
            "version": pkg.version,
            "description": pkg.description,
            "dependencies": parseDependencies(pkg.dependencies),
            "devDependencies": parseDependencies(pkg.devDependencies),
            "engines": pkg.engines,
            "license": pkg.license,
            "author": processAuthors(pkg.author),
            "contributors": processAuthors(pkg.contributors),
            "scripts": Object.entries(pkg.scripts).map(([key, value]) => {
                return [key, {
                    "script": `${package_manager} ${key}`,
                    "actualScript": value,
                    "doc": pkg.scriptsDoc ? pkg.scriptsDoc[key] : ''
                }]
            })
                .filter(([key, value]) => value.doc)
                .reduce((all, [key, value]) => ({...all, ...{[key]: value}}), {})
        };

    };

/**
 * process md string from the generated structure
 * @returns {string}
 */
const genMdString= () => {
    if(!pkg){
        throw "package.json not found";
    }
    const parsedData = parseData(pkg);
return `# ${parsedData.name} ${parsedData.version}

${parsedData.description}


${(pkg.engines) ? `## Prerequisite` : ``}
${(pkg.engines) ? Object.entries(pkg.engines).reduce((all, [key, value]) => `${all}
- ${key} ${value}`, ``): ``}

${(pkg.scriptsDoc) ? `## Available Commands` : ``}
${Object.entries(parsedData.scripts).reduce((all, [key, scriptRef]) => (`${all}
##### ${scriptRef.doc}
     ${scriptRef.script}
`), ``)}

${(Object.keys(parsedData.dependencies).length>0) ? Object.entries(parsedData.dependencies).reduce((all, [key, value]) => (`${all}
- [${key}](${value.repository}): (${value.actualVersion}) ${value.description}`), `## Dependencies`): ``}

${(Object.keys(parsedData.devDependencies).length>0) ? Object.entries(parsedData.devDependencies).reduce((all, [key, value]) => (`${all}
- [${key}](${value.repository}): (${value.actualVersion}) ${value.description}`), `## Dev Dependencies`): ``}

${parsedData.author && parsedData.author.reduce((all, object) => { return (object.email)?`${all}
- [${object.name}](mailto:${object.email})`:`${all}
- ${object.name}`}, `## Authors`) || ``}

${parsedData.contributors && parsedData.contributors.reduce((all, object) => { return (object.email)?`${all}
- [${object.name}](mailto:${object.email})`:`${all} 
- ${object.name}`}, `## Contributors`) || ``}

## License
${pkg.license}
`;
};

/**
 * generate the readme file
 * @param processedOptions
 */
const genMd = (processedOptions) => {
        fs.writeFile(path.resolve(scandir,'README.md'),genMdString(), (err, val) => {
            return err && console.log(err) || console.log("generated README.md");
        });
    };

/**
 * generate ref file structure
 */
const genRef = () => {
        fs.writeFile(path.resolve(scandir,'ref.json'),JSON.stringify(parsedData, null, 4), (err, val) => {
            return err && console.log(err) || console.log("generated ref.json");

        });
    };

module.exports  = {genMd};
