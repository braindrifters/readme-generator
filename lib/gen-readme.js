const path=require('path');
const fs=require('fs');
const scandir = process.cwd();

export class GenReadme{
    private pkg;

    constructor(){
        this.getPackageJson();
    }

    private getPackageJson(){
        this.pkg = require(path.resolve(scandir,'package.json'));
    }
    private parseDependencies = (dependencies) => Object.entries(dependencies).map(([key, value]) => {
        const file = path.resolve(scandir, `node_modules`);
        if(fs.statSync(file).isDirectory()){
            console.log('yes')
        }else{
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
    }).reduce((all, [key, value]) => ({...all, ...{[key]: value}}), {});

    private processAuthors = (authors) => {
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


    private parsseData(pkg){
        return {
            "name" : pkg.name,
            "version": pkg.version,
            "description": pkg.description,
            "dependencies": this.parseDependencies(pkg.dependencies),
            "devDependencies": this.parseDependencies(pkg.devDependencies),
            "license": pkg.license,
            "author": this.processAuthors(pkg.author),
            "contributors": this.processAuthors(pkg.contributors),
            "scripts": Object.entries(pkg.scripts).map(([key, value]) => {
                return [key, {
                    "script": `yarn ${key}`,
                    "actualScript": value,
                    "doc": pkg.scriptsDoc ? pkg.scriptsDoc[key] : ''
                }]
            })
                .filter(([key, value]) => value.doc)
                .reduce((all, [key, value]) => ({...all, ...{[key]: value}}), {})
        };

    }

    private genMdString(){
        if(!this.pkg){
            throw "package.json not found";
        }
        const parsedData = this.parsseData(this.pkg);
        return `#${parsedData.name} ${parsedData.version}
        
        ${parsedData.description}
        
        ${(parsedData.scriptsDoc) ? `##Available Commands` : ``}
        ${Object.entries(parsedData.scripts).reduce((all, [key, scriptRef]) => (`${all}
        ####${scriptRef.doc}
             ${scriptRef.script}
        `), ``)}
        
        ${Object.entries(parsedData.dependencies).reduce((all, [key, value]) => (`${all}
        - [${key}](${value.repository}): (${value.actualVersion}) ${value.description}`), `##Dependencies`)}
        
        ${Object.entries(parsedData.devDependencies).reduce((all, [key, value]) => (`${all}
        - [${key}](${value.repository}): (${value.actualVersion}) ${value.description}`), `##Dev Dependencies`)}
        
        ${parsedData.author && parsedData.author.reduce((all, object) => { return (object.email)?`${all}
        - [${object.name}](mailto:${object.email})`:`${all}
        - ${object.name}`}, `##Authors`) || ``}
        
        ${parsedData.contributors && parsedData.contributors.reduce((all, object) => { return (object.email)?`${all}
        - [${object.name}](mailto:${object.email})`:`${all} 
        - ${object.name}`}, `##Contributors`) || ``}
        
        ##License
        ${pkg.license}
        `;
    }

    genMd(){
        fs.writeFile(path.resolve(scandir,'README.md'),this.genMdString(), (err, val) => {
            return err && console.log(err) || console.log("generated README.md");
        });
    }

    genRef(){
        fs.writeFile(path.resolve(scandir,'ref.json'),JSON.stringify(parsedData, null, 4), (err, val) => {
            return err && console.log(err) || console.log("generated ref.json");

        });
    }

}
